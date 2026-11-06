window.__ModuleLoader__.load({
  id: '@local/dsh-worktrees',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh.worktrees'
    const API = '/dsh-worktrees/api'
    const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/

    const DICTS = {
      en: {
        'panel.label': 'Worktrees',
        'panel.title': 'Worktrees',
        'panel.subtitle': 'Create a worktree from a workspace, work in it, then merge it back.',
        'action.addRepo': 'Add repository',
        'action.picking': 'Choosing…',
        'action.refresh': 'Refresh',
        'action.refreshing': 'Refreshing…',
        'action.create': 'Create worktree',
        'action.merge': 'Merge back',
        'action.merged': 'Merged',
        'action.confirmMerge': 'Merge',
        'action.remove': 'Remove worktree…',
        'action.confirmRemove': 'Remove worktree',
        'action.cancel': 'Cancel',
        'action.open': 'Open session',
        'action.addToSidebar': 'Add to sidebar',
        'action.removeFromSidebar': 'Remove from sidebar',
        'action.startSession': 'Start a session here',
        'action.retry': 'Try again',
        'action.restore': 'Restore defaults…',
        'action.confirmRestore': 'Restore defaults',
        'action.more': 'More actions',
        'create.workspace': 'Repository',
        'create.name': 'Name',
        'create.placeholder': 'feat-cap-table',
        'create.hint': 'Letters, digits, dot, dash and underscore. Becomes the branch name.',
        'create.shortcut': 'Command-Return',
        'search.placeholder': 'Search branches or paths',
        'sort.label': 'Sort',
        'sort.default': 'Git order',
        'sort.name': 'Name',
        'sort.ahead': 'Commits ahead',
        'search.empty': 'No worktrees match “{query}”.',
        'search.count': '{shown} of {total}',
        'action.collapseAll': 'Collapse all',
        'action.expandAll': 'Expand all',
        'collapse.toggle': 'Collapse or expand {title}',
        'collapse.autoExpand': 'Expands while searching',
        'create.error.empty': 'Enter a name.',
        'create.error.invalid': 'Use letters, digits, dot, dash or underscore, starting with a letter or digit.',
        'create.error.duplicate': 'A branch with this name already exists in the repository.',
        'notice.created': 'Created {branch}.',
        'notice.merged': 'Merged {branch} into the workspace.',
        'notice.alreadyMerged': 'Already merged — nothing to bring over.',
        'notice.removed': 'Removed the worktree.',
        'notice.removedWithBranch': 'Removed the worktree and its branch.',
        'notice.registered': 'Added to the sidebar.',
        'notice.unregistered': 'Removed from the sidebar. Files are untouched.',
        'notice.adopted': 'Added workspace {path}.',
        'notice.alreadyAdopted': '{path} is already a workspace.',
        'notice.restored': 'Restored: unregistered {count} worktree workspaces.',
        'notice.autoOn': 'On: existing and new worktrees are added to the sidebar.',
        'notice.autoOff': 'Off: worktrees stay out of the sidebar.',
        'merge.title': 'Merge {branch} into {target}',
        'merge.detail': '{ahead} commits ahead{behind}. The workspace must have no uncommitted changes.',
        'merge.detailNothing': 'Nothing to merge — the branch is already in {target}.',
        'remove.title': 'Remove worktree {branch}?',
        'remove.body': 'Deletes {path}. The branch is kept unless you choose otherwise.',
        'remove.deleteBranch': 'Also delete the branch {branch} (merged already)',
        'remove.branchKept': 'The branch {branch} still has unmerged commits and is kept.',
        'restore.title': 'Restore defaults?',
        'restore.body': 'Unregisters every worktree workspace and stops adding new ones to the sidebar. Files, branches and sessions are kept.',
        'state.dirty': 'uncommitted',
        'state.merged': 'merged',
        'state.unregistered': 'not in sidebar',
        'state.detached': 'detached',
        'state.ahead': '{count} ahead',
        'state.behind': '{count} behind',
        'state.sessions': '{count} sessions',
        'state.sessions.one': '1 session',
        'loading.title': 'Loading worktrees…',
        'loading.body': 'Reading git worktree metadata and working-tree state.',
        'empty.title': 'No worktrees yet',
        'empty.body': 'Add a Git repository, then name a worktree to create one. Work happens in its own session, and merges back here.',
        'repo.empty': 'No worktrees yet — name one above to create it.',
        'error.load': 'Could not load worktrees',
        'settings.auto': 'Add new worktrees to the sidebar automatically',
        'settings.auto.hint': 'Shows them nested under their workspace in the sidebar tree.',
      },
      zh: {
        'panel.label': 'Worktree 管理',
        'panel.title': 'Worktree',
        'panel.subtitle': '从工作区拉出 worktree，在里面干活，完成后合并回来。',
        'action.addRepo': '添加仓库',
        'action.picking': '选择文件夹…',
        'action.refresh': '刷新',
        'action.refreshing': '正在刷新…',
        'action.create': '创建 worktree',
        'action.merge': '合并回工作区',
        'action.merged': '已合并',
        'action.confirmMerge': '合并',
        'action.remove': '移除 worktree…',
        'action.confirmRemove': '移除 worktree',
        'action.cancel': '取消',
        'action.open': '打开会话',
        'action.addToSidebar': '加入侧边栏',
        'action.removeFromSidebar': '移出侧边栏',
        'action.startSession': '在这里开始会话',
        'action.retry': '重试',
        'action.restore': '恢复默认…',
        'action.confirmRestore': '恢复默认',
        'action.more': '更多操作',
        'create.workspace': '仓库',
        'create.name': '名称',
        'create.placeholder': 'feat-cap-table',
        'create.hint': '字母、数字、点、短横线、下划线；会成为分支名。',
        'create.shortcut': '⌘⏎',
        'search.placeholder': '搜索分支或路径',
        'sort.label': '排序',
        'sort.default': '默认顺序',
        'sort.name': '按名称',
        'sort.ahead': '按领先提交',
        'search.empty': '没有匹配“{query}”的 worktree。',
        'search.count': '{shown} / {total}',
        'action.collapseAll': '全部折叠',
        'action.expandAll': '全部展开',
        'collapse.toggle': '折叠或展开 {title}',
        'collapse.autoExpand': '搜索时自动展开',
        'create.error.empty': '请输入名称。',
        'create.error.invalid': '只能用字母、数字、点、短横线、下划线，并以字母或数字开头。',
        'create.error.duplicate': '仓库里已经有同名分支了。',
        'notice.created': '已创建 {branch}。',
        'notice.merged': '已把 {branch} 合并回工作区。',
        'notice.alreadyMerged': '已经合并过了，没有需要带回来的改动。',
        'notice.removed': '已移除 worktree。',
        'notice.removedWithBranch': '已移除 worktree 及其分支。',
        'notice.registered': '已加入侧边栏。',
        'notice.unregistered': '已移出侧边栏，文件保留。',
        'notice.adopted': '已添加工作区 {path}。',
        'notice.alreadyAdopted': '{path} 已经是工作区了。',
        'notice.restored': '已恢复默认：注销了 {count} 个 worktree 工作区。',
        'notice.autoOn': '已开启：现有和新建的 worktree 都会加入侧边栏。',
        'notice.autoOff': '已关闭：worktree 不再加入侧边栏。',
        'merge.title': '把 {branch} 合并到 {target}',
        'merge.detail': '领先 {ahead} 个提交{behind}。主工作区必须没有未提交的改动。',
        'merge.detailNothing': '没有需要合并的内容——分支已在 {target} 里。',
        'remove.title': '移除 worktree {branch}？',
        'remove.body': '会删除 {path}；分支默认保留，除非你勾选下面的选项。',
        'remove.deleteBranch': '同时删除分支 {branch}（已合并）',
        'remove.branchKept': '分支 {branch} 还有未合并的提交，会保留。',
        'restore.title': '恢复默认？',
        'restore.body': '将注销所有 worktree 工作区，并停止自动加入侧边栏。文件、分支、会话都不删除。',
        'state.dirty': '有未提交改动',
        'state.merged': '已合并',
        'state.unregistered': '未加入侧边栏',
        'state.detached': '游离 HEAD',
        'state.ahead': '领先 {count}',
        'state.behind': '落后 {count}',
        'state.sessions': '{count} 个会话',
        'state.sessions.one': '1 个会话',
        'loading.title': '正在加载 worktree…',
        'loading.body': '读取 git worktree 元数据与工作区状态。',
        'empty.title': '还没有 worktree',
        'empty.body': '先添加一个 Git 仓库，再输入名称创建 worktree。工作在它自己的会话里进行，完成后回到这里合并。',
        'repo.empty': '这个仓库还没有 worktree，在上方输入名称即可创建。',
        'error.load': '无法加载 worktree 列表',
        'settings.auto': '新建的 worktree 自动加入侧边栏',
        'settings.auto.hint': '侧边栏的工作区树会把它们嵌在对应工作区下。',
      },
    }

    let translate = (key, vars) => {
      const template = DICTS.zh[key] === undefined ? key : DICTS.zh[key]
      return vars ? template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : String(vars[k]))) : template
    }

    function bindLocale(ctx) {
      try {
        const dispose = ctx.locale.register(NS, DICTS)
        const bound = ctx.locale.bind(NS)
        translate = (key, vars) => {
          let text
          try {
            text = bound(key, vars)
          } catch {
            text = undefined
          }
          if (typeof text !== 'string' || text === key) {
            const template = DICTS.zh[key] === undefined ? key : DICTS.zh[key]
            text = vars ? template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? '' : String(vars[k]))) : template
          }
          return text
        }
        return dispose
      } catch (error) {
        console.warn('[worktrees] locale registration failed', error)
        return () => {}
      }
    }

    const t = (key, vars) => translate(key, vars)

    // Remounting the panel must not blank the list while the Host recomputes
    // git state: paint the last snapshot immediately, then refresh in place.
    let panelCache = null

    // Per-repository disclosure state, remembered per browser like the shipped
    // sidebar remembers its own expansion.
    const COLLAPSED_KEY = 'dsh-worktrees:collapsed'

    function readCollapsed() {
      try {
        if (typeof localStorage === 'undefined') return {}
        const raw = localStorage.getItem(COLLAPSED_KEY)
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        return {}
      }
    }

    function writeCollapsed(value) {
      try {
        if (typeof localStorage === 'undefined') return
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(value))
      } catch {
        // storage may be unavailable; disclosure still works for this mount
      }
    }

    async function api(path, init) {
      const response = await fetch(API + path, {
        headers: { 'content-type': 'application/json' },
        ...init,
      })
      const text = await response.text()
      let payload
      try {
        payload = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(text.slice(0, 200) || response.statusText)
      }
      if (!response.ok) throw new Error(payload.error || response.statusText)
      return payload
    }

    const CSS = `
.dshwt-root{height:100%;overflow:auto;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.55}
.dshwt-inner{max-width:880px;margin:0 auto;padding:28px 28px 72px}
.dshwt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.dshwt-title{margin:0;font-size:18px;font-weight:600;letter-spacing:.1px}
.dshwt-sub{margin:4px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px}
.dshwt-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dshwt-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:7px;padding:5px 11px;font-size:12px;line-height:1.5;cursor:pointer;font-family:inherit}
.dshwt-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2)}
.dshwt-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dshwt-btn:disabled{opacity:.45;cursor:default}
.dshwt-btn.primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.dshwt-btn.danger{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-state-error-primary)}
.dshwt-btn.danger:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent)}
.dshwt-btn.ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary)}
.dshwt-btn.ghost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshwt-btn.link{background:none;border:0;padding:2px 0;color:var(--dsw-alias-label-secondary);text-decoration:underline;text-underline-offset:3px}
.dshwt-btn.link:hover{color:var(--dsw-alias-label-primary)}
.dshwt-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:visible;margin-bottom:14px}
.dshwt-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--dsw-alias-bg-layer-2);border-radius:12px 12px 0 0}
.dshwt-card-title{margin:0;font-weight:600;font-size:13px}
.dshwt-repo-toggle{display:inline-flex;align-items:center;gap:6px;appearance:none;background:none;border:0;padding:0;margin:0;font:inherit;font-weight:600;font-size:13px;color:var(--dsw-alias-label-primary);cursor:pointer;border-radius:5px}
.dshwt-repo-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px}
.dshwt-chevron{width:12px;height:12px;flex:none;transform-origin:50% 50%}
.dshwt-repo-toggle[aria-expanded="false"] .dshwt-chevron{transform:rotate(-90deg)}
.dshwt-repo-toggle:disabled{cursor:default}
.dshwt-repo-toggle:disabled .dshwt-chevron{opacity:.35}
.dshwt-card-path{color:var(--dsw-alias-label-secondary);font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshwt-list{list-style:none;margin:0;padding:0}
.dshwt-wt{padding:12px 14px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:8px}
.dshwt-wt-main{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.dshwt-branch{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
.dshwt-spacer{flex:1 1 auto}
.dshwt-chip{font-size:11px;line-height:1.5;padding:0 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.dshwt-chip::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary);margin-right:5px;vertical-align:1px}
.dshwt-chip[data-state="warn"]::before{background:var(--dsw-alias-state-warn-primary)}
.dshwt-chip[data-state="ok"]::before{background:var(--dsw-alias-state-success-primary)}
.dshwt-chip.plain::before{display:none}
.dshwt-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.dshwt-search{flex:1 1 auto;min-width:0}
.dshwt-sort{display:flex;align-items:center;gap:7px;flex:0 0 auto}
.dshwt-kbd{font:inherit;font-size:10px;line-height:1.4;border:1px solid rgba(255,255,255,.45);border-radius:4px;padding:0 4px;margin-left:7px;opacity:.85}
.dshwt-input{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:7px;padding:5px 9px;font-size:12px;font-family:inherit;min-width:180px}
.dshwt-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.dshwt-input[aria-invalid="true"]{border-color:var(--dsw-alias-state-error-primary)}
.dshwt-field{display:flex;flex-direction:column;gap:4px;min-width:200px}
.dshwt-field-label{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshwt-field-error{font-size:11px;color:var(--dsw-alias-label-primary)}
.dshwt-field-error::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-error-primary);margin-right:5px;vertical-align:1px}
.dshwt-field-hint{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshwt-notice{display:flex;gap:10px;align-items:flex-start;border-radius:9px;padding:9px 12px;margin-bottom:14px;font-size:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.dshwt-notice.ok{border-color:var(--dsw-alias-state-success-primary);border-left-width:3px}
.dshwt-notice.error{border-color:var(--dsw-alias-state-error-primary);border-left-width:3px;color:var(--dsw-alias-label-primary)}
.dshwt-notice ul{margin:6px 0 0;padding-left:18px;color:var(--dsw-alias-label-secondary)}
.dshwt-notice .dshwt-btn{flex:0 0 auto}
.dshwt-empty{padding:36px 16px;text-align:center;color:var(--dsw-alias-label-secondary);display:flex;flex-direction:column;align-items:center;gap:10px}
.dshwt-empty strong{color:var(--dsw-alias-label-primary);font-size:13px}
.dshwt-empty p{margin:0;max-width:420px}
.dshwt-menu-wrap{position:relative}
.dshwt-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:30;min-width:190px;padding:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-overlay);box-shadow:0 8px 24px rgba(0,0,0,.18)}
.dshwt-menu button{display:block;width:100%;text-align:left;appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:6px 9px;border-radius:6px;cursor:pointer}
.dshwt-menu button:hover,.dshwt-menu button:focus-visible{background:var(--dsw-alias-bg-layer-2);outline:none}
.dshwt-menu button.danger{color:var(--dsw-alias-label-primary)}
.dshwt-menu button.danger::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-state-error-primary);margin-right:7px}
.dshwt-confirm{border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);padding:10px 14px;border-radius:0 0 12px 12px;display:flex;flex-direction:column;gap:8px}
.dshwt-confirm p{margin:0;font-size:12px}
.dshwt-confirm .dshwt-sub{font-size:11px}
.dshwt-check{display:flex;align-items:center;gap:7px;font-size:12px}
.dshwt-check input{margin:0}
.dshwt-foot{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-top:22px;padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1)}
.dshwt-setting{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--dsw-alias-label-primary)}
.dshwt-setting input{margin:2px 0 0}
.dshwt-setting small{display:block;color:var(--dsw-alias-label-secondary);font-size:11px}
.dshwt-restore{margin-top:10px}
`

    function PanelIcon(props) {
      const size = props && props.size ? props.size : 18
      const active = Boolean(props && props.active)
      const stroke = active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)'
      // 14pt grid with a 1.2 stroke, matching the host's sidebar glyphs
      // (ui-schedule draws on 14 with stroke 1 and currentColor).
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('path', { d: 'M4 2.5v6.1', stroke, strokeWidth: 1.2, strokeLinecap: 'round' }),
        h('circle', { cx: 4, cy: 2.3, r: 1.2, stroke, strokeWidth: 1.2 }),
        h('path', { d: 'M4 5h3.6c.9 0 1.6.7 1.6 1.6v.9', stroke, strokeWidth: 1.2, strokeLinecap: 'round' }),
        h('circle', { cx: 9.2, cy: 10, r: 1.6, stroke, strokeWidth: 1.2 }),
        h('circle', { cx: 4, cy: 10, r: 1.6, stroke, strokeWidth: 1.2 }),
        h('path', { d: 'M4 8.2v.2', stroke, strokeWidth: 1.2, strokeLinecap: 'round' }),
      )
    }

    function createPanel(ctx) {
      /** Overflow menu for one row: one trigger, keyboard dismissable. */
      function RowMenu(props) {
        const [open, setOpen] = React.useState(false)
        const wrapRef = React.useRef(null)
        const triggerRef = React.useRef(null)
        const menuRef = React.useRef(null)

        React.useEffect(() => {
          if (!open) return undefined
          const onPointer = (event) => {
            if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
          }
          const onKey = (event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              if (triggerRef.current) triggerRef.current.focus()
            }
          }
          document.addEventListener('mousedown', onPointer)
          document.addEventListener('keydown', onKey)
          const first = menuRef.current && menuRef.current.querySelector('button')
          if (first) first.focus()
          return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('keydown', onKey)
          }
        }, [open])

        return h(
          'div',
          { className: 'dshwt-menu-wrap', ref: wrapRef },
          h(
            'button',
            {
              ref: triggerRef,
              className: 'dshwt-btn',
              'aria-haspopup': 'menu',
              'aria-expanded': open,
              'aria-label': t('action.more'),
              disabled: props.disabled,
              onClick: () => setOpen((value) => !value),
            },
            '⋯',
          ),
          open
            ? h(
                'div',
                { className: 'dshwt-menu', role: 'menu', ref: menuRef },
                props.items.map((item) =>
                  h(
                    'button',
                    {
                      key: item.id,
                      role: 'menuitem',
                      className: item.danger ? 'danger' : undefined,
                      onClick: () => {
                        setOpen(false)
                        item.onSelect()
                      },
                    },
                    item.label,
                  ),
                ),
              )
            : null,
        )
      }

      function WorktreeRow(props) {
        const { repo, worktree, busy, run, notify, openWorkspace } = props
        const [confirm, setConfirm] = React.useState(null)
        const [deleteBranch, setDeleteBranch] = React.useState(false)
        const confirmRef = React.useRef(null)

        React.useEffect(() => {
          if (!confirm || !confirmRef.current) return
          const target = confirm === 'remove'
            ? confirmRef.current.querySelector('[data-cancel]')
            : confirmRef.current.querySelector('[data-primary]')
          if (target) target.focus()
        }, [confirm])

        const target = repo.branch ? `${repo.title} · ${repo.branch}` : repo.title
        const canMerge = Boolean(worktree.branch) && !worktree.merged

        const items = []
        if (worktree.workspaceId) {
          items.push({ id: 'open', label: t('action.open'), onSelect: () => openWorkspace(worktree.workspaceId) })
          items.push({ id: 'unregister', label: t('action.removeFromSidebar'), onSelect: () => unregister() })
        } else {
          items.push({ id: 'register', label: t('action.addToSidebar'), onSelect: () => register() })
        }
        items.push({ id: 'remove', label: t('action.remove'), danger: true, onSelect: () => { setDeleteBranch(false); setConfirm('remove') } })

        async function merge() {
          const result = await run('/merge', { path: worktree.path })
          setConfirm(null)
          if (result) {
            notify({
              kind: 'ok',
              text: result.alreadyMerged ? t('notice.alreadyMerged') : t('notice.merged', { branch: worktree.branch }),
            })
          }
        }

        async function remove() {
          const result = await run('/remove', { path: worktree.path, deleteBranch })
          setConfirm(null)
          if (result) notify({ kind: 'ok', text: result.branchDeleted ? t('notice.removedWithBranch') : t('notice.removed') })
        }

        async function register() {
          const result = await run('/register', { path: worktree.path })
          if (result) notify({ kind: 'ok', text: t('notice.registered') })
        }

        async function unregister() {
          const result = await run('/unregister', { path: worktree.path })
          if (result) notify({ kind: 'ok', text: t('notice.unregistered') })
        }

        const chips = []
        if (worktree.sessionCount > 0) {
          chips.push(
            h('span', { key: 'sessions', className: 'dshwt-chip' }, worktree.sessionCount === 1 ? t('state.sessions.one') : t('state.sessions', { count: worktree.sessionCount })),
          )
        }
        if (worktree.dirty > 0) chips.push(h('span', { key: 'dirty', className: 'dshwt-chip', 'data-state': 'warn' }, t('state.dirty')))
        if (worktree.ahead > 0) chips.push(h('span', { key: 'ahead', className: 'dshwt-chip' }, t('state.ahead', { count: worktree.ahead })))
        if (worktree.behind > 0) chips.push(h('span', { key: 'behind', className: 'dshwt-chip' }, t('state.behind', { count: worktree.behind })))
        if (worktree.merged) chips.push(h('span', { key: 'merged', className: 'dshwt-chip', 'data-state': 'ok' }, t('state.merged')))
        if (!worktree.workspaceId) chips.push(h('span', { key: 'unregistered', className: 'dshwt-chip' }, t('state.unregistered')))
        if (!worktree.branch) chips.push(h('span', { key: 'detached', className: 'dshwt-chip' }, t('state.detached')))

        return h(
          'li',
          { className: 'dshwt-wt' },
          h(
            'div',
            { className: 'dshwt-wt-main' },
            h('span', { className: 'dshwt-branch', title: worktree.path }, worktree.branch || 'detached'),
            chips,
            h('span', { className: 'dshwt-spacer' }),
            h(
              'button',
              {
                className: canMerge ? 'dshwt-btn' : 'dshwt-btn ghost',
                disabled: busy || !worktree.branch || worktree.merged,
                onClick: () => setConfirm('merge'),
              },
              worktree.merged ? t('action.merged') : t('action.merge'),
            ),
            h(RowMenu, { items, disabled: busy }),
          ),
          confirm === 'merge'
            ? h(
                'div',
                { className: 'dshwt-confirm', ref: confirmRef, role: 'group', 'aria-label': t('merge.title', { branch: worktree.branch, target }) },
                h('p', null, t('merge.title', { branch: worktree.branch, target })),
                h(
                  'p',
                  { className: 'dshwt-sub' },
                  worktree.merged
                    ? t('merge.detailNothing', { target })
                    : t('merge.detail', {
                        ahead: worktree.ahead,
                        behind: worktree.behind > 0 ? t('state.behind', { count: worktree.behind }) : '',
                      }),
                ),
                h(
                  'div',
                  { className: 'dshwt-row' },
                  h('button', { className: 'dshwt-btn primary', 'data-primary': true, disabled: busy || worktree.merged, onClick: merge }, t('action.confirmMerge')),
                  h('button', { className: 'dshwt-btn ghost', 'data-cancel': true, onClick: () => setConfirm(null) }, t('action.cancel')),
                ),
              )
            : null,
          confirm === 'remove'
            ? h(
                'div',
                { className: 'dshwt-confirm', ref: confirmRef, role: 'group', 'aria-label': t('remove.title', { branch: worktree.branch }) },
                h('p', null, t('remove.title', { branch: worktree.branch || worktree.path })),
                h('p', { className: 'dshwt-sub' }, t('remove.body', { path: worktree.path })),
                worktree.merged && worktree.branch
                  ? h(
                      'label',
                      { className: 'dshwt-check' },
                      h('input', { type: 'checkbox', checked: deleteBranch, onChange: (event) => setDeleteBranch(event.target.checked) }),
                      t('remove.deleteBranch', { branch: worktree.branch }),
                    )
                  : worktree.branch
                    ? h('p', { className: 'dshwt-sub' }, t('remove.branchKept', { branch: worktree.branch }))
                    : null,
                h(
                  'div',
                  { className: 'dshwt-row' },
                  h('button', { className: 'dshwt-btn danger', disabled: busy, onClick: remove }, t('action.confirmRemove')),
                  h('button', { className: 'dshwt-btn ghost', 'data-cancel': true, onClick: () => setConfirm(null) }, t('action.cancel')),
                ),
              )
            : null,
        )
      }

      return function WorktreesPanel() {
        const [data, setData] = React.useState(panelCache)
        const [loading, setLoading] = React.useState(panelCache === null)
        const [error, setError] = React.useState(null)
        const [busy, setBusy] = React.useState(false)
        const [notice, setNotice] = React.useState(null)
        const [restoring, setRestoring] = React.useState(false)
        const [picking, setPicking] = React.useState(false)
        const [name, setName] = React.useState('')
        const [touched, setTouched] = React.useState(false)
        const [query, setQuery] = React.useState('')
        const [sort, setSort] = React.useState('default')
        const [collapsed, setCollapsed] = React.useState(readCollapsed)
        const [parent, setParent] = React.useState('')
        const [, forceRender] = React.useReducer((value) => value + 1, 0)

        React.useEffect(() => {
          const off = ctx.locale.subscribe(forceRender)
          return () => {
            if (typeof off === 'function') off()
          }
        }, [])

        React.useEffect(() => {
          if (!notice || notice.kind !== 'ok') return undefined
          const timer = setTimeout(() => setNotice(null), 6000)
          return () => clearTimeout(timer)
        }, [notice])

        const reload = React.useCallback(async () => {
          setLoading(true)
          try {
            const next = await api('/tree')
            panelCache = next
            setData(next)
            setError(null)
            setParent((current) => {
              if (current && next.repos.some((repo) => repo.id === current)) return current
              return next.repos.length > 0 ? next.repos[0].id : ''
            })
          } catch (problem) {
            setError(problem.message || String(problem))
          } finally {
            setLoading(false)
          }
        }, [])

        React.useEffect(() => {
          reload()
        }, [reload])

        const notify = React.useCallback((next) => setNotice(next), [])

        const run = React.useCallback(
          async (path, body) => {
            setBusy(true)
            try {
              const result = await api(path, { method: 'POST', body: JSON.stringify(body) })
              if (result && result.ok === false) {
                setNotice({
                  kind: 'error',
                  text: result.message || t('error.load'),
                  files: result.files || result.conflicts || [],
                })
                return null
              }
              await reload()
              return result
            } catch (problem) {
              setNotice({ kind: 'error', text: problem.message || String(problem) })
              return null
            } finally {
              setBusy(false)
            }
          },
          [reload],
        )

        const repos = data ? data.repos : []
        const grouped = data && data.settings ? data.settings.grouping === 'worktree' : true
        const needle = query.trim().toLowerCase()
        const sortList = (list) => {
          if (sort === 'name') return [...list].sort((a, b) => String(a.branch || '').localeCompare(String(b.branch || '')))
          if (sort === 'ahead') return [...list].sort((a, b) => b.ahead - a.ahead)
          return list
        }
        const visible = repos
          .map((repo) => {
            const repoHit = !needle || repo.title.toLowerCase().includes(needle) || repo.path.toLowerCase().includes(needle)
            const matches = repoHit
              ? repo.worktrees
              : repo.worktrees.filter(
                  (worktree) => String(worktree.branch || '').toLowerCase().includes(needle) || worktree.path.toLowerCase().includes(needle),
                )
            return { repo, list: sortList(matches) }
          })
          .filter((entry) => !needle || entry.repo.title.toLowerCase().includes(needle) || entry.repo.path.toLowerCase().includes(needle) || entry.list.length > 0)
        const totalWorktrees = repos.reduce((sum, repo) => sum + repo.worktrees.length, 0)
        const shownWorktrees = visible.reduce((sum, entry) => sum + entry.list.length, 0)

        function toggleAll() {
          const anyExpanded = repos.some((repo) => !collapsed[repo.id])
          const next = anyExpanded ? Object.fromEntries(repos.map((repo) => [repo.id, true])) : {}
          setCollapsed(next)
          writeCollapsed(next)
        }

        function toggleRepo(repoId) {
          setCollapsed((current) => {
            const next = { ...current, [repoId]: !current[repoId] }
            writeCollapsed(next)
            return next
          })
        }

        function nameError(value) {
          const trimmed = value.trim()
          if (!trimmed) return t('create.error.empty')
          if (!NAME_PATTERN.test(trimmed)) return t('create.error.invalid')
          const repo = repos.find((candidate) => candidate.id === parent)
          if (repo && repo.worktrees.some((worktree) => worktree.branch === trimmed)) return t('create.error.duplicate')
          return null
        }

        const currentError = name.trim() ? nameError(name) : touched ? t('create.error.empty') : null

        function openWorkspace(workspaceId) {
          if (!workspaceId) return
          if (ctx.uiWorkspace && typeof ctx.uiWorkspace.openWorkspace === 'function') {
            ctx.uiWorkspace.openWorkspace(workspaceId)
          }
        }

        async function create() {
          setTouched(true)
          const problem = nameError(name)
          if (problem) return
          const result = await run('/create', { workspaceId: parent, name: name.trim() })
          if (!result) return
          setName('')
          setTouched(false)
          notify({
            kind: 'ok',
            text: t('notice.created', { branch: result.branch }),
            action: result.workspaceId
              ? { label: t('action.startSession'), onClick: () => openWorkspace(result.workspaceId) }
              : null,
          })
        }

        /**
         * The Desktop app exposes the OS chooser through its preload bridge
         * (`__DSH_DIRECTORY_PICKER__.pick()`), which is what the shipped
         * directory-flow driver uses there; the Remote is the fallback for a
         * browser-only host.
         */
        function pickDirectory() {
          const bridge = typeof globalThis === 'undefined' ? undefined : globalThis.__DSH_DIRECTORY_PICKER__
          if (bridge && typeof bridge.pick === 'function') return bridge.pick()
          return ctx.uiWorkspace.pickDirectory()
        }

        async function addRepository() {
          if (picking) return
          let path
          setPicking(true)
          try {
            path = await pickDirectory()
          } catch (problem) {
            setNotice({ kind: 'error', text: problem.message || String(problem) })
            return
          } finally {
            setPicking(false)
          }
          if (!path) return
          const result = await run('/adopt', { path })
          if (!result) return
          if (result.workspaceId) setParent(result.workspaceId)
          notify({
            kind: 'ok',
            text: result.created ? t('notice.adopted', { path: result.path }) : t('notice.alreadyAdopted', { path: result.path }),
          })
        }

        async function setAutoAdd(enabled) {
          const result = await run('/settings', { grouping: enabled ? 'worktree' : 'workspace' })
          if (result) notify({ kind: 'ok', text: enabled ? t('notice.autoOn') : t('notice.autoOff') })
        }

        async function restore() {
          const result = await run('/rollback', {})
          setRestoring(false)
          if (result) notify({ kind: 'ok', text: t('notice.restored', { count: result.removed.length }) })
        }

        const body = []

        if (error) {
          body.push(
            h(
              'div',
              { key: 'error', className: 'dshwt-notice error', role: 'alert' },
              h('div', { style: { flex: '1' } }, `${t('error.load')}: ${error}`),
              h('button', { className: 'dshwt-btn', onClick: reload }, t('action.retry')),
            ),
          )
        }

        if (notice) {
          body.push(
            h(
              'div',
              { key: 'notice', className: `dshwt-notice ${notice.kind}`, role: notice.kind === 'error' ? 'alert' : 'status' },
              h(
                'div',
                { style: { flex: '1' } },
                notice.text,
                notice.files && notice.files.length
                  ? h('ul', null, notice.files.slice(0, 12).map((file) => h('li', { key: file }, file)))
                  : null,
              ),
              notice.action
                ? h('button', { className: 'dshwt-btn', onClick: notice.action.onClick }, notice.action.label)
                : null,
            ),
          )
        }

        if (data && repos.length > 0) {
          body.push(
            h(
              'div',
              { key: 'create', className: 'dshwt-card' },
              h(
                'div',
                { className: 'dshwt-row', style: { padding: '12px 14px', alignItems: 'flex-end' } },
                h(
                  'label',
                  { className: 'dshwt-field' },
                  h('span', { className: 'dshwt-field-label' }, t('create.workspace')),
                  h(
                    'select',
                    {
                      className: 'dshwt-input',
                      value: parent,
                      disabled: busy || repos.length === 0,
                      onChange: (event) => setParent(event.target.value),
                    },
                    repos.map((repo) => h('option', { key: repo.id, value: repo.id }, `${repo.title} — ${repo.path}`)),
                  ),
                ),
                h(
                  'label',
                  { className: 'dshwt-field' },
                  h('span', { className: 'dshwt-field-label' }, t('create.name')),
                  h('input', {
                    className: 'dshwt-input',
                    placeholder: t('create.placeholder'),
                    value: name,
                    disabled: busy,
                    'aria-invalid': currentError ? 'true' : 'false',
                    'aria-describedby': 'dshwt-name-help',
                    onChange: (event) => setName(event.target.value),
                    onBlur: () => setTouched(true),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey) create()
                    },
                  }),
                  h(
                    'span',
                    { id: 'dshwt-name-help', className: currentError ? 'dshwt-field-error' : 'dshwt-field-hint' },
                    currentError || t('create.hint'),
                  ),
                ),
                h(
                  'button',
                  { className: 'dshwt-btn primary', disabled: busy || !parent || !name.trim() || Boolean(nameError(name)), onClick: create, title: t('create.shortcut') },
                  t('action.create'),
                  h('kbd', { className: 'dshwt-kbd' }, t('create.shortcut')),
                ),
              ),
            ),
          )
        }

        if (data && repos.length > 0) {
          body.push(
            h(
              'div',
              { key: 'toolbar', className: 'dshwt-toolbar' },
              h('input', {
                className: 'dshwt-input dshwt-search',
                type: 'search',
                placeholder: t('search.placeholder'),
                'aria-label': t('search.placeholder'),
                value: query,
                onChange: (event) => setQuery(event.target.value),
              }),
              h(
                'label',
                { className: 'dshwt-sort' },
                h('span', { className: 'dshwt-field-label' }, t('sort.label')),
                h(
                  'select',
                  { className: 'dshwt-input', value: sort, onChange: (event) => setSort(event.target.value) },
                  h('option', { value: 'default' }, t('sort.default')),
                  h('option', { value: 'name' }, t('sort.name')),
                  h('option', { value: 'ahead' }, t('sort.ahead')),
                ),
              ),
              needle ? h('span', { className: 'dshwt-chip plain' }, t('search.count', { shown: shownWorktrees, total: totalWorktrees })) : null,
              h(
                'button',
                {
                  className: 'dshwt-btn ghost',
                  disabled: busy || Boolean(needle),
                  title: needle ? t('collapse.autoExpand') : undefined,
                  onClick: toggleAll,
                },
                repos.some((repo) => !collapsed[repo.id]) ? t('action.collapseAll') : t('action.expandAll'),
              ),
            ),
          )
        }

        if (!data) {
          body.push(
            h(
              'div',
              { key: 'loading', className: 'dshwt-empty', role: 'status' },
              h('strong', null, t('loading.title')),
              h('p', null, t('loading.body')),
            ),
          )
        } else if (repos.length === 0) {
          body.push(
            h(
              'div',
              { key: 'empty', className: 'dshwt-empty' },
              h('strong', null, t('empty.title')),
              h('p', null, t('empty.body')),
              h('button', { className: 'dshwt-btn primary', disabled: busy || picking, onClick: addRepository }, picking ? t('action.picking') : t('action.addRepo')),
            ),
          )
        } else if (needle && visible.length === 0) {
          body.push(
            h(
              'div',
              { key: 'search-empty', className: 'dshwt-empty', role: 'status' },
              h('strong', null, t('search.empty', { query })),
            ),
          )
        } else {
          for (const { repo, list } of visible) {
            // A search always reveals matches; the saved state only governs
            // ordinary browsing.
            const folded = !needle && Boolean(collapsed[repo.id])
            body.push(
              h(
                'section',
                { key: repo.id, className: 'dshwt-card' },
                h(
                  'div',
                  { className: 'dshwt-card-head' },
                  h(
                    'div',
                    { style: { minWidth: 0 } },
                    h(
                      'h2',
                      { className: 'dshwt-card-title' },
                      h(
                        'button',
                        {
                          className: 'dshwt-repo-toggle',
                          'aria-expanded': folded ? 'false' : 'true',
                          'aria-controls': `dshwt-list-${repo.id}`,
                          disabled: Boolean(needle),
                          title: needle ? t('collapse.autoExpand') : t('collapse.toggle', { title: repo.title }),
                          onClick: () => toggleRepo(repo.id),
                        },
                        h(
                          'svg',
                          { className: 'dshwt-chevron', viewBox: '0 0 12 12', 'aria-hidden': true },
                          h('path', {
                            d: 'M3 4.5 6 7.5 9 4.5',
                            fill: 'none',
                            stroke: 'currentColor',
                            strokeWidth: 1.4,
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                          }),
                        ),
                        repo.title,
                      ),
                    ),
                    h('div', { className: 'dshwt-card-path', title: repo.path }, repo.path),
                  ),
                  h('span', { className: 'dshwt-chip plain' }, `${list.length} worktree`),
                ),
                h(
                  'ul',
                  { className: 'dshwt-list', id: `dshwt-list-${repo.id}`, hidden: folded },
                  list.length === 0
                    ? h('li', { className: 'dshwt-wt' }, h('div', { className: 'dshwt-card-path' }, t('repo.empty')))
                    : list.map((worktree) =>
                        h(WorktreeRow, {
                          key: worktree.path,
                          repo,
                          worktree,
                          busy,
                          run,
                          notify,
                          openWorkspace,
                        }),
                      ),
                ),
              ),
            )
          }
        }

        body.push(
          h(
            'div',
            { key: 'foot', className: 'dshwt-foot' },
            h(
              'div',
              null,
              h(
                'label',
                { className: 'dshwt-setting' },
                h('input', {
                  type: 'checkbox',
                  checked: grouped,
                  disabled: busy,
                  onChange: (event) => setAutoAdd(event.target.checked),
                }),
                h('span', null, t('settings.auto'), h('small', null, t('settings.auto.hint'))),
              ),
              h(
                'div',
                { className: 'dshwt-restore' },
                h('button', { className: 'dshwt-btn link', disabled: busy, onClick: () => setRestoring(true) }, t('action.restore')),
                restoring
                  ? h(
                      'div',
                      { className: 'dshwt-confirm', role: 'group', 'aria-label': t('restore.title') },
                      h('p', null, t('restore.title')),
                      h('p', { className: 'dshwt-sub' }, t('restore.body')),
                      h(
                        'div',
                        { className: 'dshwt-row' },
                        h('button', { className: 'dshwt-btn danger', disabled: busy, onClick: restore }, t('action.confirmRestore')),
                        h('button', { className: 'dshwt-btn ghost', onClick: () => setRestoring(false) }, t('action.cancel')),
                      ),
                    )
                  : null,
              ),
            ),
          ),
        )

        return h(
          'div',
          {
            className: 'dshwt-root',
            'aria-busy': loading,
            onKeyDown: (event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                create()
              }
            },
          },
          h('style', null, CSS),
          h(
            'div',
            { className: 'dshwt-inner' },
            h(
              'header',
              { className: 'dshwt-head' },
              h(
                'div',
                null,
                h('h1', { className: 'dshwt-title' }, t('panel.title')),
                h('p', { className: 'dshwt-sub' }, t('panel.subtitle')),
              ),
              h(
                'div',
                { className: 'dshwt-row' },
                loading && data ? h('span', { className: 'dshwt-chip plain', role: 'status' }, t('action.refreshing')) : null,
                h('button', { className: 'dshwt-btn', disabled: busy || picking, onClick: addRepository }, picking ? t('action.picking') : t('action.addRepo')),
                h('button', { className: 'dshwt-btn ghost', disabled: busy, onClick: reload }, t('action.refresh')),
              ),
            ),
            body,
          ),
        )
      }
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        const Panel = createPanel(ctx)
        ctx.effect(() => bindLocale(ctx), 'worktrees: dictionaries')

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({ name: 'sidebar.panellist', id: 'worktrees', order: 20, label: () => t('panel.label') }, PanelIcon),
        )

        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'worktrees' }, Panel))
      },
    }
  },
})
