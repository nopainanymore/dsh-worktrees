window.__ModuleLoader__.load({
  id: '@local/dsh-worktrees',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh.worktrees'
    const API = '/dsh-worktrees/api'

    const DICTS = {
      en: {
        'panel.label': 'Worktrees',
        'panel.title': 'Worktrees',
        'panel.subtitle': 'Workspace + worktree two-level management. Finish a worktree, merge it back.',
        'grouping.title': 'Grouping',
        'grouping.worktree': 'Workspace + worktree',
        'grouping.workspace': 'Workspace only',
        'grouping.hint.worktree': 'New worktrees register as child Workspaces, so the sidebar tree shows two levels.',
        'grouping.hint.workspace': 'Worktrees stay out of the sidebar; this panel is the only management surface.',
        'action.refresh': 'Refresh',
        'action.rollback': 'Restore default',
        'action.rollback.confirm': 'Unregister every worktree child Workspace and reset the grouping setting?',
        'action.create': 'Create worktree',
        'action.merge': 'Merge back',
        'action.remove': 'Remove',
        'action.register': 'Add to sidebar',
        'action.unregister': 'Remove from sidebar',
        'action.open': 'Open',
        'action.confirm': 'Confirm',
        'action.cancel': 'Cancel',
        'create.placeholder': 'worktree name',
        'create.workspace': 'Parent workspace',
        'empty.title': 'No worktrees yet',
        'empty.body': 'Pick a Git workspace and create a worktree. Changes made there merge back into that workspace. If the list is empty, add a Git repository as a workspace from the sidebar first.',
        'state.dirty': 'uncommitted',
        'state.merged': 'merged',
        'state.unregistered': 'not in sidebar',
        'state.external': 'external',
        'remove.external.hint': 'This worktree lives outside .agents/worktrees: removing it deletes that checkout directory (its branch stays).',
        'state.detached': 'detached',
        'state.ahead': '{count} ahead',
        'state.behind': '{count} behind',
        'footer.hint': 'Settings live in ~/.dsh/worktrees/settings.json; defaults come from this plugin row in cordis.patch.yml.',
        'error.load': 'Could not load worktrees',
        'busy': 'Working…',
      },
      zh: {
        'panel.label': 'Worktree 管理',
        'panel.title': 'Worktree 管理',
        'panel.subtitle': '工作区 + worktree 两级管理，完成后合并回工作区。',
        'grouping.title': '分组方式',
        'grouping.worktree': '工作区 + worktree',
        'grouping.workspace': '仅工作区',
        'grouping.hint.worktree': '新建的 worktree 会注册为子工作区，侧边栏的工作区树自动呈现两级。',
        'grouping.hint.workspace': 'worktree 不进入侧边栏，只在这个面板里管理。',
        'action.refresh': '刷新',
        'action.rollback': '还原默认',
        'action.rollback.confirm': '要取消所有 worktree 子工作区注册，并把分组方式还原为默认吗？',
        'action.create': '创建 worktree',
        'action.merge': '合并回工作区',
        'action.remove': '移除',
        'action.register': '加入侧边栏',
        'action.unregister': '移出侧边栏',
        'action.open': '打开',
        'action.confirm': '确认',
        'action.cancel': '取消',
        'create.placeholder': 'worktree 名称',
        'create.workspace': '父工作区',
        'empty.title': '还没有 worktree',
        'empty.body': '选择一个 Git 工作区并创建 worktree；其中的改动完成后可以合并回该工作区。列表为空时，先用侧边栏的“添加工作区”把一个 Git 仓库加入工作区。',
        'state.dirty': '有未提交改动',
        'state.merged': '已合并',
        'state.unregistered': '未加入侧边栏',
        'state.external': '外部 worktree',
        'remove.external.hint': '这个 worktree 不在 .agents/worktrees 下：移除会删除该检出目录（分支保留）。',
        'state.detached': '游离 HEAD',
        'state.ahead': '领先 {count}',
        'state.behind': '落后 {count}',
        'footer.hint': '设置保存在 ~/.dsh/worktrees/settings.json；默认值来自 cordis.patch.yml 里的本插件行。',
        'error.load': '无法加载 worktree 列表',
        'busy': '处理中…',
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
.dshwt-inner{max-width:900px;margin:0 auto;padding:28px 28px 72px}
.dshwt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.dshwt-title{font-size:18px;font-weight:600;letter-spacing:.1px}
.dshwt-sub{margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:12px}
.dshwt-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dshwt-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:7px;padding:4px 10px;font-size:12px;line-height:1.5;cursor:pointer;font-family:inherit}
.dshwt-btn:hover{border-color:var(--dsw-alias-border-l2)}
.dshwt-btn:disabled{opacity:.45;cursor:default}
.dshwt-btn.primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.dshwt-btn.danger{color:var(--dsw-alias-state-error-primary)}
.dshwt-btn.ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary)}
.dshwt-btn.ghost:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshwt-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}
.dshwt-seg button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit}
.dshwt-seg button+button{border-left:1px solid var(--dsw-alias-border-l1)}
.dshwt-seg button[data-on="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:500}
.dshwt-card{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;margin-bottom:14px}
.dshwt-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--dsw-alias-bg-layer-2)}
.dshwt-card-title{font-weight:550;font-size:13px}
.dshwt-card-path{color:var(--dsw-alias-label-secondary);font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
.dshwt-wt{padding:12px 14px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:8px}
.dshwt-wt-main{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dshwt-branch{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:600}
.dshwt-chip{font-size:11px;line-height:1.5;padding:0 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.dshwt-chip.ok{color:var(--dsw-alias-state-success-primary);border-color:currentColor}
.dshwt-chip.warn{color:var(--dsw-alias-state-warn-primary);border-color:currentColor}
.dshwt-chip.gray{color:var(--dsw-alias-label-secondary)}
.dshwt-input{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:7px;padding:4px 9px;font-size:12px;font-family:inherit;min-width:180px}
.dshwt-input:focus{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-1px}
.dshwt-notice{display:flex;gap:10px;align-items:flex-start;border-radius:9px;padding:9px 12px;margin-bottom:14px;font-size:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.dshwt-notice.ok{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.dshwt-notice.error{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.dshwt-notice ul{margin:6px 0 0;padding-left:18px;color:var(--dsw-alias-label-secondary)}
.dshwt-empty{padding:36px 16px;text-align:center;color:var(--dsw-alias-label-secondary)}
.dshwt-empty strong{display:block;color:var(--dsw-alias-label-primary);font-size:13px;margin-bottom:4px}
.dshwt-hint{color:var(--dsw-alias-label-secondary);font-size:11px;margin-top:10px}
.dshwt-col{display:flex;flex-direction:column;gap:6px}
.dshwt-warnline{color:var(--dsw-alias-state-warn-primary);font-size:11px}
.dshwt-split{display:flex;align-items:center;gap:8px;padding:12px 14px;flex-wrap:wrap}
`

    function PanelIcon(props) {
      const size = props && props.size ? props.size : 18
      const active = Boolean(props && props.active)
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 20 20',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', {
          d: 'M5.5 3.5v9.2',
          stroke: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
        h('circle', {
          cx: 5.5,
          cy: 3.2,
          r: 1.7,
          stroke: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: 1.4,
        }),
        h('path', {
          d: 'M5.5 7.1h5.2c1.3 0 2.3 1 2.3 2.3v1.2',
          stroke: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
        h('circle', {
          cx: 13,
          cy: 14.2,
          r: 2.2,
          stroke: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: 1.4,
        }),
        h('circle', {
          cx: 5.5,
          cy: 14.2,
          r: 2.2,
          stroke: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: 1.4,
        }),
        h('path', {
          d: 'M5.5 11.4v.6',
          stroke: active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
        }),
      )
    }

    function createPanel(ctx) {
      return function WorktreesPanel() {
        const [data, setData] = React.useState(null)
        const [error, setError] = React.useState(null)
        const [busy, setBusy] = React.useState(false)
        const [notice, setNotice] = React.useState(null)
        const [confirm, setConfirm] = React.useState(null)
        const [name, setName] = React.useState('')
        const [parent, setParent] = React.useState('')
        const [, forceRender] = React.useReducer((value) => value + 1, 0)

        React.useEffect(() => {
          const off = ctx.locale.subscribe(forceRender)
          return () => {
            if (typeof off === 'function') off()
          }
        }, [])

        const reload = React.useCallback(async () => {
          try {
            const next = await api('/tree')
            setData(next)
            setError(null)
            setParent((current) => {
              if (current && next.repos.some((repo) => repo.id === current)) return current
              return next.repos.length > 0 ? next.repos[0].id : ''
            })
          } catch (problem) {
            setError(problem.message || String(problem))
          }
        }, [])

        React.useEffect(() => {
          reload()
        }, [reload])

        const run = React.useCallback(
          async (path, body, okText) => {
            setBusy(true)
            setNotice(null)
            try {
              const result = await api(path, { method: 'POST', body: JSON.stringify(body) })
              if (result && result.ok === false) {
                setNotice({
                  kind: 'error',
                  text: result.message || t('error.load'),
                  files: result.files || result.conflicts || [],
                })
              } else {
                setNotice({ kind: 'ok', text: typeof okText === 'function' ? okText(result) : okText })
              }
              await reload()
              return result
            } catch (problem) {
              setNotice({ kind: 'error', text: problem.message || String(problem) })
              return null
            } finally {
              setBusy(false)
              setConfirm(null)
            }
          },
          [reload],
        )

        const grouping = data && data.settings ? data.settings.grouping : 'worktree'
        const repos = data ? data.repos : []

        function create() {
          if (!parent || !name.trim()) return
          run('/create', { workspaceId: parent, name: name.trim() }, (result) => {
            setName('')
            return result.workspaceId
              ? `已创建 ${result.branch}，并已注册为子工作区`
              : `已创建 ${result.branch}`
          })
        }

        function switchGrouping(next) {
          if (next === grouping) return
          run('/settings', { grouping: next }, next === 'worktree' ? '已切换为 工作区 + worktree 两级' : '已切换为仅工作区')
        }

        function openWorkspace(workspaceId) {
          if (!workspaceId) return
          if (ctx.uiWorkspace && typeof ctx.uiWorkspace.openWorkspace === 'function') {
            ctx.uiWorkspace.openWorkspace(workspaceId)
          }
        }

        function chips(worktree) {
          const items = []
          if (worktree.dirty > 0) items.push(h('span', { key: 'dirty', className: 'dshwt-chip warn' }, t('state.dirty')))
          if (worktree.ahead > 0) items.push(h('span', { key: 'ahead', className: 'dshwt-chip gray' }, t('state.ahead', { count: worktree.ahead })))
          if (worktree.behind > 0) items.push(h('span', { key: 'behind', className: 'dshwt-chip gray' }, t('state.behind', { count: worktree.behind })))
          if (worktree.merged) items.push(h('span', { key: 'merged', className: 'dshwt-chip ok' }, t('state.merged')))
          if (!worktree.workspaceId) items.push(h('span', { key: 'unregistered', className: 'dshwt-chip gray' }, t('state.unregistered')))
          if (!worktree.branch) items.push(h('span', { key: 'detached', className: 'dshwt-chip gray' }, t('state.detached')))
          return items
        }

        function rowActions(repo, worktree) {
          const key = worktree.path
          const keyed = confirm && confirm.key === key ? confirm.kind : null
          if (keyed === 'merge') {
            return h(
              'div',
              { className: 'dshwt-row' },
              h('button', { className: 'dshwt-btn primary', disabled: busy, onClick: () => run('/merge', { path: worktree.path }, '已合并回工作区') }, t('action.confirm')),
              h('button', { className: 'dshwt-btn ghost', onClick: () => setConfirm(null) }, t('action.cancel')),
            )
          }
          if (keyed === 'remove') {
            return h(
              'div',
              { className: 'dshwt-col' },
              worktree.inPool
                ? null
                : h('div', { className: 'dshwt-warnline' }, t('remove.external.hint')),
              h(
                'div',
                { className: 'dshwt-row' },
                h('button', { className: 'dshwt-btn danger', disabled: busy, onClick: () => run('/remove', { path: worktree.path, deleteBranch: worktree.merged }, (result) => (result.branchDeleted ? '已移除 worktree 与分支' : '已移除 worktree')) }, t('action.confirm')),
                h('button', { className: 'dshwt-btn ghost', onClick: () => setConfirm(null) }, t('action.cancel')),
              ),
            )
          }
          return h(
            'div',
            { className: 'dshwt-row' },
            worktree.workspaceId
              ? h('button', { className: 'dshwt-btn', disabled: busy || !worktree.branch, onClick: () => setConfirm({ key, kind: 'merge' }) }, t('action.merge'))
              : h('button', { className: 'dshwt-btn', disabled: busy, onClick: () => run('/register', { path: worktree.path }, '已加入侧边栏') }, t('action.register')),
            h('button', { className: 'dshwt-btn danger', disabled: busy, onClick: () => setConfirm({ key, kind: 'remove' }) }, t('action.remove')),
            worktree.workspaceId
              ? h('button', { className: 'dshwt-btn ghost', disabled: busy, onClick: () => openWorkspace(worktree.workspaceId) }, t('action.open'))
              : null,
            worktree.workspaceId
              ? h('button', { className: 'dshwt-btn ghost', disabled: busy, onClick: () => run('/unregister', { path: worktree.path }, '已从侧边栏移除，文件保留') }, t('action.unregister'))
              : null,
          )
        }

        const body = []

        if (error) {
          body.push(
            h('div', { key: 'error', className: 'dshwt-notice error' }, h('div', null, `${t('error.load')}: ${error}`)),
          )
        }
        if (confirm && confirm.kind === 'rollback') {
          body.push(
            h(
              'div',
              { key: 'rollback-confirm', className: 'dshwt-notice' },
              h('div', { style: { flex: '1' } }, t('action.rollback.confirm')),
              h(
                'div',
                { className: 'dshwt-row' },
                h(
                  'button',
                  {
                    className: 'dshwt-btn danger',
                    disabled: busy,
                    onClick: () => run('/rollback', {}, (result) => `已还原：取消注册 ${result.removed.length} 个 worktree 子工作区`),
                  },
                  t('action.confirm'),
                ),
                h('button', { className: 'dshwt-btn ghost', onClick: () => setConfirm(null) }, t('action.cancel')),
              ),
            ),
          )
        }
        if (notice) {
          body.push(
            h(
              'div',
              { key: 'notice', className: `dshwt-notice ${notice.kind}` },
              h(
                'div',
                null,
                notice.text,
                notice.files && notice.files.length
                  ? h('ul', null, notice.files.slice(0, 12).map((file) => h('li', { key: file }, file)))
                  : null,
              ),
            ),
          )
        }

        body.push(
          h(
            'div',
            { key: 'create', className: 'dshwt-card' },
            h(
              'div',
              { className: 'dshwt-split' },
              h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12 } }, t('create.workspace')),
              h(
                'select',
                {
                  className: 'dshwt-input',
                  value: parent,
                  disabled: busy || repos.length === 0,
                  onChange: (event) => setParent(event.target.value),
                },
                repos.map((repo) => h('option', { key: repo.id, value: repo.id }, `${repo.title}`)),
              ),
              h('input', {
                className: 'dshwt-input',
                placeholder: t('create.placeholder'),
                value: name,
                disabled: busy,
                onChange: (event) => setName(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') create()
                },
              }),
              h('button', { className: 'dshwt-btn primary', disabled: busy || !parent || !name.trim(), onClick: create }, t('action.create')),
            ),
          ),
        )

        if (grouping === 'workspace') {
          body.push(h('div', { key: 'ghint', className: 'dshwt-hint' }, t('grouping.hint.workspace')))
        }

        if (repos.length === 0) {
          body.push(
            h(
              'div',
              { key: 'empty', className: 'dshwt-empty' },
              h('strong', null, t('empty.title')),
              h('div', null, t('empty.body')),
            ),
          )
        }

        for (const repo of repos) {
          body.push(
            h(
              'section',
              { key: repo.id, className: 'dshwt-card' },
              h(
                'div',
                { className: 'dshwt-card-head' },
                h(
                  'div',
                  null,
                  h('div', { className: 'dshwt-card-title' }, repo.title),
                  h('div', { className: 'dshwt-card-path' }, repo.path),
                ),
                h('span', { className: 'dshwt-chip gray' }, `${repo.worktrees.length} worktree`),
              ),
              repo.worktrees.map((worktree) =>
                h(
                  'div',
                  { key: worktree.path, className: 'dshwt-wt' },
                  h(
                    'div',
                    { className: 'dshwt-wt-main' },
                    h('span', { className: 'dshwt-branch' }, worktree.branch || 'detached'),
                    h('span', { className: 'dshwt-card-path' }, worktree.path),
                    chips(worktree),
                  ),
                  rowActions(repo, worktree),
                ),
              ),
            ),
          )
        }

        body.push(h('div', { key: 'hint', className: 'dshwt-hint' }, t('footer.hint')))

        return h(
          'div',
          { className: 'dshwt-root' },
          h('style', null, CSS),
          h(
            'div',
            { className: 'dshwt-inner' },
            h(
              'div',
              { className: 'dshwt-head' },
              h(
                'div',
                null,
                h('div', { className: 'dshwt-title' }, t('panel.title')),
                h('div', { className: 'dshwt-sub' }, t('panel.subtitle')),
              ),
              h(
                'div',
                { className: 'dshwt-row' },
                h(
                  'div',
                  { className: 'dshwt-seg', role: 'group', 'aria-label': t('grouping.title') },
                  h('button', { 'data-on': grouping === 'worktree', disabled: busy, onClick: () => switchGrouping('worktree') }, t('grouping.worktree')),
                  h('button', { 'data-on': grouping === 'workspace', disabled: busy, onClick: () => switchGrouping('workspace') }, t('grouping.workspace')),
                ),
                h('button', { className: 'dshwt-btn', disabled: busy, onClick: reload }, t('action.refresh')),
                h(
                  'button',
                  {
                    className: 'dshwt-btn ghost',
                    disabled: busy,
                    onClick: () => setConfirm({ key: '__rollback__', kind: 'rollback' }),
                  },
                  t('action.rollback'),
                ),
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
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'worktrees',
              order: 20,
              label: () => t('panel.label'),
            },
            PanelIcon,
          ),
        )

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'worktrees' }, Panel),
        )
      },
    }
  },
})
