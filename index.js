/**
 * Worktrees host half.
 *
 * Owns the HTTP surface the Worktrees panel calls. Every git operation is a
 * literal argv `git` invocation inside the registered Workspace directory, and
 * the only durable writes are git's own worktree metadata plus an optional
 * settings file under `$DSH_HOME/worktrees/`.
 *
 * Nothing here touches the shipped Workspace browser: Workspace registration
 * and removal go through `ctx.workspaceRegistry`, the same service the shipped
 * UI uses, so the existing sidebar keeps working unchanged.
 */
import { execFile } from 'node:child_process'
import { copyFile, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join, sep } from 'node:path'

const API_PREFIX = '/dsh-worktrees/api'
const POOL_DIR = '.agents/worktrees'
const DEFAULT_SETTINGS = {
  grouping: 'worktree',
  registerOnCreate: true,
  branchPrefix: '',
  copyIgnored: ['.env', '.env.local'],
}
const SESSION_FILE_NAME = 'worktrees'

export const inject = ['webServer', 'workspaceRegistry']

/* ------------------------------------------------------------------ */
/* settings                                                            */
/* ------------------------------------------------------------------ */

function pickSettings(source) {
  if (source === null || typeof source !== 'object') return {}
  const out = {}
  if (source.grouping === 'worktree' || source.grouping === 'workspace') out.grouping = source.grouping
  if (typeof source.registerOnCreate === 'boolean') out.registerOnCreate = source.registerOnCreate
  if (typeof source.branchPrefix === 'string' && /^[A-Za-z0-9._/-]{0,40}$/.test(source.branchPrefix)) {
    out.branchPrefix = source.branchPrefix
  }
  if (Array.isArray(source.copyIgnored)) {
    out.copyIgnored = source.copyIgnored.filter(
      (value) => typeof value === 'string' && value.length > 0 && value.length < 200 && !value.startsWith('/') && !value.includes('..'),
    )
  }
  return out
}

/* ------------------------------------------------------------------ */
/* git                                                                 */
/* ------------------------------------------------------------------ */

const GIT_CANDIDATES = [
  process.env.DSH_GIT,
  'git',
  '/usr/bin/git',
  '/opt/homebrew/bin/git',
  '/usr/local/bin/git',
].filter((value) => typeof value === 'string' && value.length > 0)

let gitBinary

function spawnGit(bin, args, cwd) {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile(
      bin,
      args,
      {
        cwd,
        timeout: 120_000,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_NO_LAZY_FETCH: '1' },
      },
      (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout
          error.stderr = stderr
          rejectPromise(error)
          return
        }
        resolvePromise({ stdout, stderr })
      },
    )
  })
}

async function resolveGit() {
  if (gitBinary) return gitBinary
  for (const candidate of GIT_CANDIDATES) {
    try {
      await spawnGit(candidate, ['--version'], process.cwd())
      gitBinary = candidate
      return candidate
    } catch {
      // try the next candidate
    }
  }
  throw httpError(503, 'git 不可用：没有找到可执行的 git')
}

async function git(cwd, args) {
  return spawnGit(await resolveGit(), args, cwd)
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function parseWorktreeList(text) {
  const entries = []
  for (const block of String(text).split('\n\n')) {
    const entry = { path: '', head: undefined, branch: null, detached: false, bare: false, locked: false }
    for (const line of block.split('\n')) {
      if (!line) continue
      const at = line.indexOf(' ')
      const key = at === -1 ? line : line.slice(0, at)
      const value = at === -1 ? '' : line.slice(at + 1)
      if (key === 'worktree') entry.path = value
      else if (key === 'HEAD') entry.head = value
      else if (key === 'branch') entry.branch = value.replace(/^refs\/heads\//, '')
      else if (key === 'detached') entry.detached = true
      else if (key === 'bare') entry.bare = true
      else if (key === 'locked') entry.locked = true
    }
    if (entry.path) entries.push(entry)
  }
  return entries
}

async function toplevelOf(directory) {
  try {
    const { stdout } = await git(directory, ['rev-parse', '--show-toplevel'])
    const path = stdout.trim()
    return path.length > 0 ? path : null
  } catch {
    return null
  }
}

async function canonical(path) {
  try {
    return await realpath(path)
  } catch {
    return path
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function dirtyStatus(directory) {
  try {
    const { stdout } = await git(directory, ['status', '--porcelain=v1', '--untracked-files=normal'])
    const lines = stdout.split('\n').map((line) => line.trimEnd()).filter((line) => line.length > 0)
    return { count: lines.length, files: lines.slice(0, 20).map((line) => line.slice(3)) }
  } catch {
    return { count: -1, files: [] }
  }
}

async function aheadBehind(root, branch) {
  try {
    const { stdout } = await git(root, ['rev-list', '--left-right', '--count', `HEAD...${branch}`])
    const [behind, ahead] = stdout.trim().split(/\s+/).map((value) => Number(value))
    if (!Number.isFinite(behind) || !Number.isFinite(ahead)) return null
    return { behind, ahead }
  } catch {
    return null
  }
}

/**
 * Run an async task over items with a bounded number of in-flight operations.
 * Git work on one repository is mostly process spawn plus a working-tree scan,
 * so a small pool converts the serial total into a couple of waves without
 * flooding the machine.
 */
async function mapLimit(items, limit, task) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = next
      next += 1
      if (index >= items.length) return
      results[index] = await task(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Tracking state of the main checkout: its upstream, how far it diverged, and
 * the remote default branch. The panel names the merge target from these so a
 * checkout sitting on a feature branch is visible before someone merges.
 */
async function upstreamStatus(root) {
  let upstream = null
  try {
    const { stdout } = await git(root, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'])
    upstream = stdout.trim() || null
  } catch {
    upstream = null
  }
  let aheadUpstream = 0
  let behindUpstream = 0
  if (upstream) {
    try {
      const { stdout } = await git(root, ['rev-list', '--left-right', '--count', `HEAD...${upstream}`])
      const [localOnly, remoteOnly] = stdout.trim().split(/\s+/).map((value) => Number(value))
      aheadUpstream = Number.isFinite(localOnly) ? localOnly : 0
      behindUpstream = Number.isFinite(remoteOnly) ? remoteOnly : 0
    } catch {
      // a missing remote ref leaves the counters at zero
    }
  }
  let defaultBranch = null
  try {
    const { stdout } = await git(root, ['symbolic-ref', '-q', 'refs/remotes/origin/HEAD'])
    defaultBranch = stdout.trim().replace(/^refs\/remotes\/origin\//, '') || null
  } catch {
    defaultBranch = null
  }
  return { upstream, aheadUpstream, behindUpstream, defaultBranch }
}

/**
 * Last commit of one working tree, for "how long has this been idle" and for
 * ordering. One extra `git log` per worktree, run in parallel with the probes.
 */
/**
 * Whether the checkout has an unfinished merge, and which paths conflict. A
 * conflicted merge is left in place on purpose: the main workspace owns the
 * resolution, and the panel only reports and aborts it.
 */
async function mergeState(root) {
  try {
    await git(root, ['rev-parse', '-q', '--verify', 'MERGE_HEAD'])
  } catch {
    return { merging: false, conflicts: [] }
  }
  const conflicts = await git(root, ['diff', '--name-only', '--diff-filter=U'])
    .then((result) => result.stdout.split('\n').map((line) => line.trim()).filter(Boolean))
    .catch(() => [])
  return { merging: true, conflicts }
}

async function lastCommitOf(directory) {
  try {
    const { stdout } = await git(directory, ['log', '-1', '--format=%H%x1f%ct%x1f%s'])
    const [sha, seconds, subject] = stdout.trim().split('\u001f')
    if (!sha) return null
    return { sha, time: Number(seconds) || 0, subject: subject || '' }
  } catch {
    return null
  }
}

async function isAncestor(root, branch) {
  try {
    await git(root, ['merge-base', '--is-ancestor', branch, 'HEAD'])
    return true
  } catch {
    return false
  }
}

async function branchExists(root, branch) {
  try {
    await git(root, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`])
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* plugin                                                              */
/* ------------------------------------------------------------------ */

export function apply(ctx, config) {
  const configDefaults = { ...DEFAULT_SETTINGS, ...pickSettings(config) }
  const settingsDir = join(process.env.DSH_HOME || join(homedir(), '.dsh'), SESSION_FILE_NAME)
  const settingsPath = join(settingsDir, 'settings.json')

  let settingsCache
  let treeCache = { at: 0, value: null }
  const TREE_TTL_MS = 8000

  async function settings() {
    if (settingsCache) return settingsCache
    let stored = {}
    try {
      stored = JSON.parse(await readFile(settingsPath, 'utf8'))
    } catch {
      stored = {}
    }
    settingsCache = { ...configDefaults, ...pickSettings(stored) }
    return settingsCache
  }

  async function writeSettings(patch) {
    const next = { ...(await settings()), ...pickSettings(patch) }
    settingsCache = next
    invalidateTree()
    await mkdir(settingsDir, { recursive: true })
    await writeFile(settingsPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
    return next
  }

  /* -------------------------- workspace bridge -------------------------- */

  function registeredWorkspaces() {
    try {
      return ctx.workspaceRegistry.list()
    } catch {
      return []
    }
  }

  function workspaceById(id) {
    if (typeof id !== 'string' || id.length === 0) return undefined
    return registeredWorkspaces().find((workspace) => workspace.id === id)
  }

  async function workspaceIdForPath(path) {
    const target = await canonical(path)
    const workspace = registeredWorkspaces().find((candidate) => candidate.path === target)
    return workspace ? workspace.id : null
  }

  async function registerWorktree(path, title) {
    const workspace = await ctx.workspaceRegistry.create(await canonical(path), title)
    return workspace.id
  }

  /* ------------------------------ queries ------------------------------ */

  function isManagedPath(path) {
    return String(path).includes(`${sep}.agents${sep}worktrees${sep}`)
  }

  async function mainRootOf(path) {
    const top = await toplevelOf(path)
    if (!top) return null
    const self = await canonical(top)
    const { stdout } = await git(self, ['worktree', 'list', '--porcelain'])
    const entries = parseWorktreeList(stdout)
    if (entries.length === 0) return null
    const main = await canonical(entries[0].path)
    return { self, main, entries, linked: main !== self }
  }

  async function registeredWorktrees() {
    const found = []
    const seen = new Set()
    for (const workspace of registeredWorkspaces()) {
      if (seen.has(workspace.path)) continue
      seen.add(workspace.path)
      if (!(await isDirectory(workspace.path))) continue
      let info
      try {
        info = await mainRootOf(workspace.path)
      } catch {
        continue
      }
      if (!info || !info.linked) continue
      found.push({ workspace, path: info.self, main: info.main })
    }
    return found
  }

  async function poolWorktrees() {
    return (await registeredWorktrees()).filter((item) => isManagedPath(item.path))
  }

  /**
   * One subprocess-free probe replaces the two git calls that used to decide
   * whether a registered Workspace is the root of a checkout. A main checkout
   * has a `.git` directory; a linked worktree's `.git` is a file, and a plain
   * subdirectory has none at all.
   */
  async function isMainCheckout(path) {
    try {
      return (await stat(join(path, '.git'))).isDirectory()
    } catch {
      return false
    }
  }

  async function listRepo(workspace) {
    if (!(await isMainCheckout(workspace.path))) return null
    const { stdout } = await git(workspace.path, ['worktree', 'list', '--porcelain'])
    const entries = parseWorktreeList(stdout)
    const root = workspace.path
    const registered = registeredWorkspaces()
    const worktrees = await mapLimit(entries.slice(1), 8, async (entry) => {
      const path = await canonical(entry.path)
      const [counts, dirty, commit] = await Promise.all([
        entry.branch ? aheadBehind(root, entry.branch) : Promise.resolve(null),
        dirtyStatus(path),
        lastCommitOf(path),
      ])
      const child = registered.find((candidate) => candidate.path === path)
      return {
        path,
        branch: entry.branch,
        head: entry.head ?? null,
        ahead: counts ? counts.ahead : 0,
        behind: counts ? counts.behind : 0,
        dirty: dirty.count,
        dirtyFiles: dirty.files,
        lastCommit: commit,
        // `ahead === 0` already means every commit of the branch is reachable
        // from HEAD, so the extra `merge-base --is-ancestor` call is redundant.
        merged: counts ? counts.ahead === 0 : false,
        workspaceId: child ? child.id : null,
        sessionCount: child ? child.sessionIds.length : 0,
        managed: isManagedPath(path),
        inPool: isManagedPath(path),
      }
    })
    const tracking = await upstreamStatus(root)
    const merge = await mergeState(root)
    return {
      id: workspace.id,
      title: workspace.title,
      path: root,
      // The main checkout's current branch is the merge target, so the panel
      // can name it instead of saying "the workspace".
      branch: entries[0].branch ?? null,
      upstream: tracking.upstream,
      aheadUpstream: tracking.aheadUpstream,
      behindUpstream: tracking.behindUpstream,
      defaultBranch: tracking.defaultBranch,
      onDefaultBranch: tracking.defaultBranch === null || tracking.defaultBranch === (entries[0].branch ?? null),
      merging: merge.merging,
      conflicts: merge.conflicts,
      worktrees,
    }
  }

  async function buildTreeUncached() {
    const seen = new Set()
    const repos = []
    for (const workspace of registeredWorkspaces()) {
      if (seen.has(workspace.path)) continue
      seen.add(workspace.path)
      repos.push(workspace)
    }
    const listed = await mapLimit(repos, 4, async (workspace) => {
      try {
        return await listRepo(workspace)
      } catch {
        return null
      }
    })
    return { repos: listed.filter(Boolean), settings: await settings(), poolDir: POOL_DIR }
  }

  async function buildTree() {
    if (treeCache.value && Date.now() - treeCache.at < TREE_TTL_MS) return treeCache.value
    const value = await buildTreeUncached()
    treeCache = { at: Date.now(), value }
    return value
  }

  function invalidateTree() {
    treeCache = { at: 0, value: null }
  }

  /* ------------------------------ actions ------------------------------ */

  function sanitizeName(raw) {
    const name = typeof raw === 'string' ? raw.trim() : ''
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(name)) {
      throw httpError(400, '名称只能包含字母、数字、点、下划线和短横线，且以字母或数字开头（最多 64 个字符）')
    }
    if (name === '.' || name === '..' || name.endsWith('.lock')) {
      throw httpError(400, '名称不可用')
    }
    return name
  }

  async function createWorktree(body) {
    const parent = workspaceById(body.workspaceId)
    if (!parent) throw httpError(404, '工作区不存在')
    const info = await mainRootOf(parent.path)
    if (!info) throw httpError(400, '该工作区不是 Git 仓库')
    if (info.linked) throw httpError(400, '请在一个仓库根工作区上创建 worktree，而不是在已有 worktree 里')
    const root = info.self
    const current = await settings()
    const name = sanitizeName(body.name)
    const branch = `${current.branchPrefix}${name}`
    if (!/^[A-Za-z0-9._/-]{1,120}$/.test(branch) || branch.endsWith('/') || branch.includes('//')) {
      throw httpError(400, '分支名不合法，检查配置里的 branchPrefix')
    }
    const target = join(root, POOL_DIR, name)
    if (await branchExists(root, branch)) throw httpError(409, `分支 ${branch} 已存在`)
    if (await isDirectory(target)) throw httpError(409, `目录已存在：${target}`)

    const from = typeof body.from === 'string' && body.from.trim() ? body.from.trim() : 'HEAD'
    let baseCommit
    try {
      baseCommit = (await git(root, ['rev-parse', '--verify', `${from}^{commit}`])).stdout.trim()
    } catch {
      throw httpError(400, `找不到基线 ${from}（需要本地分支、tag 或提交）`)
    }

    await git(root, ['worktree', 'add', '-b', branch, target, baseCommit])
    invalidateTree()
    await ensurePoolIgnore(root)
    const copied = await copyIgnoredFiles(root, target, current.copyIgnored)
    let workspaceId = null
    if (current.registerOnCreate && current.grouping === 'worktree') {
      workspaceId = await registerWorktree(target, `worktree: ${name}`)
    }
    return { path: target, branch, workspaceId, from, baseCommit, copied }
  }

  /**
   * `git worktree add` never carries untracked files, so a fresh checkout has
   * no local configuration. Copy the configured relative paths when the source
   * has them; a missing source file is not an error.
   */
  async function isGitIgnored(root, relative) {
    try {
      await git(root, ['check-ignore', '-q', '--', relative])
      return true
    } catch {
      return false
    }
  }

  async function copyIgnoredFiles(sourceRoot, targetRoot, patterns) {
    const copied = []
    for (const relative of patterns || []) {
      // Only ignore-listed files may be copied: anything else would make the
      // fresh worktree dirty the moment it exists and block merge/remove.
      if (!(await isGitIgnored(sourceRoot, relative))) continue
      const from = join(sourceRoot, relative)
      const to = join(targetRoot, relative)
      try {
        if (!(await stat(from)).isFile()) continue
        await mkdir(dirname(to), { recursive: true })
        await copyFile(from, to)
        copied.push(relative)
      } catch {
        // a missing or unreadable source file is simply not copied
      }
    }
    return copied
  }

  async function ensurePoolIgnore(root) {
    const pool = join(root, POOL_DIR)
    await mkdir(pool, { recursive: true })
    const ignore = join(pool, '.gitignore')
    try {
      await stat(ignore)
    } catch {
      await writeFile(ignore, '*\n', 'utf8')
    }
  }

  async function locate(path) {
    if (typeof path !== 'string' || path.length === 0) throw httpError(400, '缺少 worktree 路径')
    if (!(await isDirectory(path))) throw httpError(404, 'worktree 目录不存在')
    const top = await toplevelOf(path)
    if (!top) throw httpError(400, '该目录不是 Git 工作树')
    const self = await canonical(top)
    if (self !== (await canonical(path))) throw httpError(400, '该目录不是 Git 工作树的根目录')
    const { stdout } = await git(self, ['worktree', 'list', '--porcelain'])
    const entries = parseWorktreeList(stdout)
    const main = entries[0]
    const entry = entries.find((candidate) => candidate.path === self)
    if (!main || !entry) throw httpError(400, '找不到 Git 工作树记录')
    if (entry === main) throw httpError(400, '主检出不能作为 worktree 合并或移除')
    return { main: await canonical(main.path), entry }
  }

  async function mergeWorktree(body) {
    const { main, entry } = await locate(body.path)
    if (!entry.branch) throw httpError(400, '该 worktree 处于 detached HEAD，无法合并')
    const pending = await mergeState(main)
    if (pending.merging) {
      return {
        ok: false,
        reason: 'merging',
        conflicts: pending.conflicts,
        message: '主工作区还有未完成的合并：先解决并提交，或放弃那次合并',
      }
    }
    const worktreeDirty = await dirtyStatus(entry.path)
    if (worktreeDirty.count !== 0) {
      return {
        ok: false,
        reason: 'worktree-dirty',
        message: '这个 worktree 还有未提交的改动：合并只会带走已提交的部分，先提交再合并',
        files: worktreeDirty.files,
      }
    }
    const dirty = await dirtyStatus(main)
    if (dirty.count !== 0) {
      return {
        ok: false,
        reason: 'dirty',
        message: '主工作区有未提交的改动，合并前请先提交或暂存',
        files: dirty.files,
      }
    }
    const alreadyMerged = await isAncestor(main, entry.branch)
    if (alreadyMerged) return { ok: true, branch: entry.branch, alreadyMerged: true }
    try {
      const { stdout } = await git(main, ['merge', '--no-ff', entry.branch, '-m', `Merge worktree '${entry.branch}'`])
      invalidateTree()
      return { ok: true, branch: entry.branch, output: stdout.trim().slice(0, 2000) }
    } catch (error) {
      const conflicts = await git(main, ['diff', '--name-only', '--diff-filter=U'])
        .then((result) => result.stdout.split('\n').map((line) => line.trim()).filter(Boolean))
        .catch(() => [])
      invalidateTree()
      return {
        ok: false,
        reason: 'conflict',
        inProgress: true,
        message: '合并冲突：已把合并留在主工作区，解决后提交，或放弃这次合并',
        conflicts,
        stderr: String(error.stderr || '').slice(0, 2000),
      }
    }
  }

  async function removeWorktree(body) {
    const { main, entry } = await locate(body.path)
    const dirty = await dirtyStatus(entry.path)
    if (dirty.count !== 0) {
      return {
        ok: false,
        reason: 'dirty',
        message: 'worktree 还有未提交的改动，先提交或丢弃再移除',
        files: dirty.files,
      }
    }
    const registeredId = await workspaceIdForPath(entry.path)
    await git(main, ['worktree', 'remove', entry.path])
    invalidateTree()
    let branchDeleted = false
    let branchError = null
    if (body.deleteBranch && entry.branch) {
      try {
        await git(main, ['branch', '-d', entry.branch])
        branchDeleted = true
      } catch (error) {
        branchError = String(error.stderr || error.message || '').trim().slice(0, 500)
      }
    }
    if (registeredId) await ctx.workspaceRegistry.delete(registeredId)
    return { ok: true, removed: entry.path, branchDeleted, branchError }
  }

  async function adoptRepository(body) {
    const raw = typeof body.path === 'string' ? body.path.trim() : ''
    if (!raw) throw httpError(400, '缺少目录路径')
    if (!(await isDirectory(raw))) throw httpError(400, `目录不存在：${raw}`)
    const info = await mainRootOf(raw)
    if (!info) throw httpError(400, '该目录不是 Git 仓库')
    const root = info.main
    const existing = await workspaceIdForPath(root)
    if (existing) return { ok: true, workspaceId: existing, path: root, created: false }
    const workspace = await ctx.workspaceRegistry.create(root, basename(root))
    invalidateTree()
    return { ok: true, workspaceId: workspace.id, path: root, created: true }
  }

  /**
   * The happy path in one call: merge what the worktree committed, then remove
   * the checkout, delete its branch and unregister the workspace. Every guard
   * runs before the first mutation, so a refusal leaves the tree untouched.
   */
  /**
   * Bring the main checkout's commits into the worktree branch by rebasing it
   * onto the current HEAD. History is rewritten on purpose (that is what makes
   * the later merge a fast-forward-free, single-branch story), so a conflict
   * aborts instead of leaving a half-rebased branch behind.
   */
  async function syncWorktree(body) {
    const { main, entry } = await locate(body.path)
    if (!entry.branch) throw httpError(400, '该 worktree 处于 detached HEAD，无法同步')
    const worktreeDirty = await dirtyStatus(entry.path)
    if (worktreeDirty.count !== 0) {
      return {
        ok: false,
        reason: 'worktree-dirty',
        message: '这个 worktree 还有未提交的改动：先提交再同步',
        files: worktreeDirty.files,
      }
    }
    const base = (await git(main, ['rev-parse', 'HEAD'])).stdout.trim()
    const upToDate = await git(entry.path, ['merge-base', '--is-ancestor', base, 'HEAD'])
      .then(() => true)
      .catch(() => false)
    if (upToDate) return { ok: true, synced: false, branch: entry.branch, baseCommit: base }
    try {
      await git(entry.path, ['rebase', base])
      invalidateTree()
      return { ok: true, synced: true, branch: entry.branch, baseCommit: base }
    } catch (error) {
      const conflicts = await git(entry.path, ['diff', '--name-only', '--diff-filter=U'])
        .then((result) => result.stdout.split('\n').map((line) => line.trim()).filter(Boolean))
        .catch(() => [])
      await git(entry.path, ['rebase', '--abort']).catch(() => {})
      invalidateTree()
      return {
        ok: false,
        reason: 'conflict',
        message: 'rebase 冲突，已回滚，工作树保持原样；请在会话里手动处理',
        conflicts,
        stderr: String(error.stderr || '').slice(0, 2000),
      }
    }
  }

  async function abortMerge(body) {
    const workspace = workspaceById(body.workspaceId)
    if (!workspace) throw httpError(404, '工作区不存在')
    const info = await mainRootOf(workspace.path)
    if (!info || info.linked) throw httpError(400, '该工作区不是主检出')
    const pending = await mergeState(info.self)
    if (!pending.merging) return { ok: true, aborted: false, conflicts: [] }
    await git(info.self, ['merge', '--abort'])
    invalidateTree()
    return { ok: true, aborted: true, conflicts: pending.conflicts }
  }

  async function finishWorktree(body) {
    const { main, entry } = await locate(body.path)
    if (!entry.branch) throw httpError(400, '该 worktree 处于 detached HEAD，无法完成')
    if (!isManagedPath(entry.path)) {
      throw httpError(400, '只对 .agents/worktrees 下的工作树执行「完成并清理」，其他目录请手动移除')
    }

    const worktreeDirty = await dirtyStatus(entry.path)
    if (worktreeDirty.count !== 0) {
      return {
        ok: false,
        reason: 'worktree-dirty',
        message: '这个 worktree 还有未提交的改动：先提交，否则清理会丢掉它们',
        files: worktreeDirty.files,
      }
    }
    const mainDirty = await dirtyStatus(main)
    if (mainDirty.count !== 0) {
      return {
        ok: false,
        reason: 'dirty',
        message: '主工作区有未提交的改动，合并前请先提交或暂存',
        files: mainDirty.files,
      }
    }

    const pending = await mergeState(main)
    if (pending.merging) {
      return {
        ok: false,
        reason: 'merging',
        conflicts: pending.conflicts,
        message: '主工作区还有未完成的合并：先解决并提交，或放弃那次合并',
      }
    }

    const alreadyMerged = await isAncestor(main, entry.branch)
    if (!alreadyMerged) {
      try {
        await git(main, ['merge', '--no-ff', entry.branch, '-m', `Merge worktree '${entry.branch}'`])
        invalidateTree()
      } catch (error) {
        const conflicts = await git(main, ['diff', '--name-only', '--diff-filter=U'])
          .then((result) => result.stdout.split('\n').map((line) => line.trim()).filter(Boolean))
          .catch(() => [])
        invalidateTree()
        return {
          ok: false,
          reason: 'conflict',
          inProgress: true,
          message: '合并冲突：已把合并留在主工作区，解决后提交，或放弃这次合并；未做任何清理',
          conflicts,
          stderr: String(error.stderr || '').slice(0, 2000),
        }
      }
    }

    const registeredId = await workspaceIdForPath(entry.path)
    try {
      await git(main, ['worktree', 'remove', entry.path])
      invalidateTree()
    } catch (error) {
      return {
        ok: false,
        reason: 'remove-failed',
        merged: !alreadyMerged,
        message: `合并已完成，但移除工作树失败：${String(error.stderr || error.message || '').trim().slice(0, 400)}`,
      }
    }

    let branchDeleted = false
    let branchError = null
    try {
      await git(main, ['branch', '-d', entry.branch])
      branchDeleted = true
    } catch (error) {
      branchError = String(error.stderr || error.message || '').trim().slice(0, 500)
    }
    if (registeredId) await ctx.workspaceRegistry.delete(registeredId)

    return { ok: true, merged: !alreadyMerged, branch: entry.branch, removed: entry.path, branchDeleted, branchError }
  }

  async function registerExisting(body) {
    const { main, entry } = await locate(body.path)
    const title = entry.branch ? `worktree: ${entry.branch}` : undefined
    const workspaceId = await registerWorktree(entry.path, title)
    invalidateTree()
    return { ok: true, workspaceId }
  }

  async function unregisterExisting(body) {
    if (typeof body.path !== 'string' || body.path.length === 0) throw httpError(400, '缺少 worktree 路径')
    const id = await workspaceIdForPath(body.path)
    if (!id) return { ok: true, workspaceId: null }
    await ctx.workspaceRegistry.delete(id)
    invalidateTree()
    return { ok: true, workspaceId: id }
  }

  async function syncGrouping(grouping) {
    const touched = []
    if (grouping === 'workspace') {
      for (const item of await poolWorktrees()) {
        await ctx.workspaceRegistry.delete(item.workspace.id)
        touched.push(item.path)
      }
      return touched
    }
    const { repos } = await buildTree()
    for (const repo of repos) {
      for (const worktree of repo.worktrees) {
        if (!worktree.inPool || worktree.workspaceId) continue
        await registerWorktree(worktree.path, worktree.branch ? `worktree: ${worktree.branch}` : undefined)
        touched.push(worktree.path)
      }
    }
    return touched
  }

  async function rollback() {
    invalidateTree()
    const removed = []
    for (const item of await registeredWorktrees()) {
      await ctx.workspaceRegistry.delete(item.workspace.id)
      removed.push(item.path)
    }
    await writeSettings({ grouping: 'workspace' })
    return { ok: true, removed, settings: await settings() }
  }

  /* ------------------------------- http -------------------------------- */

  function send(res, status, payload) {
    const text = JSON.stringify(payload ?? {})
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(text)
  }

  function isLocal(req) {
    const address = req.socket?.remoteAddress || ''
    return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
  }

  function readJson(req) {
    return new Promise((resolvePromise, rejectPromise) => {
      const chunks = []
      let size = 0
      req.on('data', (chunk) => {
        size += chunk.length
        if (size > 1024 * 1024) {
          rejectPromise(httpError(413, '请求体过大'))
          req.destroy()
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => {
        if (chunks.length === 0) {
          resolvePromise({})
          return
        }
        try {
          resolvePromise(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        } catch {
          rejectPromise(httpError(400, '请求体不是合法 JSON'))
        }
      })
      req.on('error', rejectPromise)
    })
  }

  const handler = async (req, res) => {
    if (!isLocal(req)) {
      send(res, 403, { error: '只接受本机请求' })
      return
    }
    try {
      const url = new URL(req.url || '/', 'http://localhost')
      if (!url.pathname.startsWith(API_PREFIX)) {
        send(res, 404, { error: 'not found' })
        return
      }
      const route = url.pathname.slice(API_PREFIX.length) || '/'
      const method = req.method || 'GET'
      if (method === 'GET' && route === '/tree') {
        send(res, 200, await buildTree())
        return
      }
      if (method === 'POST') {
        const body = await readJson(req)
        if (route === '/settings') {
          const next = await writeSettings(body)
          const synced = body && body.grouping ? await syncGrouping(next.grouping) : []
          send(res, 200, { ok: true, settings: next, synced })
          return
        }
        if (route === '/create') {
          send(res, 200, await createWorktree(body))
          return
        }
        if (route === '/merge') {
          send(res, 200, await mergeWorktree(body))
          return
        }
        if (route === '/remove') {
          send(res, 200, await removeWorktree(body))
          return
        }
        if (route === '/sync') {
          send(res, 200, await syncWorktree(body))
          return
        }
        if (route === '/abort-merge') {
          send(res, 200, await abortMerge(body))
          return
        }
        if (route === '/finish') {
          send(res, 200, await finishWorktree(body))
          return
        }
        if (route === '/adopt') {
          send(res, 200, await adoptRepository(body))
          return
        }
        if (route === '/register') {
          send(res, 200, await registerExisting(body))
          return
        }
        if (route === '/unregister') {
          send(res, 200, await unregisterExisting(body))
          return
        }
        if (route === '/rollback') {
          send(res, 200, await rollback())
          return
        }
      }
      send(res, 404, { error: 'not found' })
    } catch (error) {
      send(res, error.status || 500, { error: error.message || String(error) })
    }
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: API_PREFIX, handler }), 'worktrees: api route')
}
