# Worktrees — 工作区 + worktree 两级管理

给 DSH Web GUI 增加一个 Worktree 面板：在工作区里创建 Git worktree，在其中工作时把改动提交，
完成后一键合并回工作区，并可移除工作树与分支。

## 形态

- 侧边栏底部面板列表新增 **Worktree 管理** 图标，打开的是 `main` 面板。
- 面板按「工作区 → worktree」两级展示；行内显示分支、会话数、ahead/behind、未提交改动、合并状态。
- 仓库分组可折叠：点仓库名展开/收起，状态按浏览器记住（`localStorage`）；工具条有「全部折叠 / 全部展开」；搜索时自动展开匹配项。
- 每行只有一个主动作「合并回工作区」，其余（打开会话、加入/移出侧边栏、移除）收进 `⋯` 菜单。
- 仓库标题栏直接显示**主检出所在分支**（合并目标）、相对上游的领先/落后，以及不在默认分支时的提醒。
- 合并确认会写明目标：「把 feat-x（领先 12 个提交）合并到 esop-server · master」；目标落后上游、
  或主检出不在 `origin/HEAD` 指向的默认分支上时，会额外提示。
- 合并前同时检查 **worktree 自身** 是否干净：有未提交改动就拒绝（否则只会带走已提交的一半）。
- 「完成并清理」一步完成合并 → 删除工作树目录 → 删除分支 → 移出侧边栏；任一步的守卫不通过都不会动任何东西。
- 有 `origin` 时行内有「推送分支」和「创建 PR…」（`gh pr create`，先自动 push）。
- 检出目录被删、git 仍留记录时，仓库标题栏显示「N 个失效条目」+「清理」（`git worktree prune`）。
- 移除确认会写明目录；已合并的分支是否一并删除由勾选框决定（默认关闭）。
- 没有 worktree 的仓库也会列出（否则新加的仓库无法创建第一个 worktree）。
- 创建、合并、移除、加入侧边栏均走同一套 Host 逻辑。
- 名称在输入时即时校验（`[A-Za-z0-9._-]`，成为分支名），错误显示在字段下方。
- 创建成功后提示条里直接给「在这里开始会话」，接上下一步；`⌘⏎`（Windows/Linux 为 Ctrl+Enter）在面板任意位置创建。
- 创建时可指定**基线**（`HEAD` / 分支 / tag / 提交），并可从主检出复制 `.env` 这类被忽略的本地配置。
- 列表上方有搜索（分支/路径/仓库名）和排序（默认 git 顺序 / 名称 / 领先提交数 / 最近提交）。
- 每行显示最后一次提交的相对时间；移除确认会提示该工作树里还有几个会话。
- 顶部「添加仓库」直接调用系统目录选择器，把 Git 仓库注册成工作区（走官方 `workspaceRegistry`），
  不用切回侧边栏；选到仓库子目录时会自动落到仓库根，已注册则返回现有工作区。

## 给 Agent 的工具

Host 侧注册了一个 `worktree` 工具（模型可见），参数：

| 参数 | 说明 |
|---|---|
| `action` | `list` / `create` / `sync` / `merge` |
| `name` | create：工作树与分支名 |
| `from` | create：基线，默认 HEAD |
| `path` | sync / merge：工作树路径（绝对或相对当前会话目录） |

`list` 会输出每棵工作树的分支、领先/落后和未提交状态。`create` 要求当前仓库已是注册工作区；
`sync` / `merge` 与面板调用同一套 Host 逻辑（冲突时同样把合并留在主工作区）。

**清理类动作（移除目录、删分支）不在工具里**——只保留在面板中，避免模型自行删除检出。

## 两级菜单从哪来

DSH 自带的 Workspace 浏览器支持 **View options → Group by → Workspace Tree**：已注册的工作区会按路径
嵌套到最近的已注册祖先之下。本插件创建的 worktree 位于 `<仓库>/.agents/worktrees/<name>`，位于仓库
内部，因此注册为工作区后会自动成为父工作区的子级——这就是「工作区 + worktree」两级菜单，全部复用
官方浏览器的分组、会话列表、拖动与归档逻辑，没有替换任何现有 UI。

## 安装

需要一份能正常启动的 DeepSeek Harness。插件只注册侧边栏槽位和一条 `/dsh-worktrees/api` 本机路由，不替换任何官方插件。

**Desktop 版**：侧边栏「插件」页 → 安装 → 填仓库地址。Desktop 的 profile 由应用自己持有，命令行 `dsh plugin --profile desktop` 会被拒绝，请用插件页操作。

**Web / CLI 版**：

```sh
dsh plugin --profile web add git+https://github.com/nopainanymore/dsh-worktrees.git
```

装完确认 profile 的 `dsh.profile.bundles` 里出现 `@local/dsh-worktrees`，然后刷新页面；没有启用 HMR 时需要重启 dsh。侧边栏底部出现 Worktree 图标即安装成功。

本地开发用绝对路径安装，改完重载即可：

```sh
dsh plugin --profile web add /absolute/path/to/dsh-worktrees
```

卸载：`dsh plugin --profile web remove @local/dsh-worktrees`。卸载前建议先用面板「还原默认」撤销自动注册的 worktree 工作区，避免留下悬空条目。

## 配置

插件行在 `cordis.patch.yml`：

```yaml
- id: worktrees
  name: '@local/dsh-worktrees'
  config:
    grouping: worktree        # worktree | workspace
    registerOnCreate: true    # 创建时是否自动注册为子工作区
    branchPrefix: ''          # 可选分支前缀，如 'wt/'（worktree 目录名仍是输入名）
    copyIgnored:              # 创建后从主检出复制这些「被 gitignore 忽略」的文件
      - .env
      - .env.local
    setupCommand: null        # 创建后在新工作树里执行的命令，例如 'pnpm install'
```

`copyIgnored` 只复制 `git check-ignore` 认定为忽略的文件——未忽略的文件不复制，否则新工作树一创建
就是脏的，合并/移除都会被拦下。

`grouping` 也可以在面板顶部切换，切换会写进 `~/.dsh/worktrees/settings.json`（运行时设置优先于上面
的默认值），并立即同步：切到 `worktree` 自动注册 `.agents/worktrees/` 池里的 worktree，切到 `workspace` 取消这些自动注册
（手工加入的不会被动）。

## 回滚

- **还原默认**（面板右上）：取消**所有** worktree 工作区注册（含手工加入的），并把分组方式置为
  `workspace`。会话、文件、分支都不删除。
- **单条移出**：面板每行的「移出侧边栏」只取消注册，文件与会话都保留。
- **彻底移除**：`plugin_manager` → 停用或卸载 `@local/dsh-worktrees`。插件只新增槽位与一条
  `/dsh-worktrees/api` 路由，停用后侧边栏立即回到原样。

## 安全边界

- 合并前要求主工作区干净；冲突时 `git merge --abort` 并回传冲突文件。
- 支持任意已存在的 worktree（同仓库的兄弟目录、`.worktrees/`、`.agents/worktrees/` 都行）；
  「移除」前检查未提交改动，外部 worktree 会在确认区标注会删除检出目录。
- 分支删除使用 `git branch -d`（已合并才允许）。
- API 只接受 127.0.0.1 / ::1 的请求。

## 兼容性

不替换、不修改任何官方插件与槽位；只对 `sidebar.panellist` 与 `main` 两个槽做增量注册。

### 侧边栏嵌套的边界

官方浏览器的 Workspace Tree 只按**路径包含**嵌套：只有位于仓库内部的worktree（默认的
`.agents/worktrees/<name>`）才会在侧边栏显示为父工作区的子级。仓库外的兄弟目录（如
`esop-server-feature-xxx`）注册后是并列的顶级工作区；它们的两级关系只体现在本面板里。

## 许可证

[MIT](LICENSE) © 2026 nopainanymore

## 性能

- `GET /tree` 结果缓存 8 秒，任何写操作（创建/合并/移除/注册/移出/切换分组/还原）立即失效。
- 每个 worktree 的状态探测（`status` + `rev-list`）并行执行，最多 8 个在飞。
- 面板重挂载时先用上一次快照渲染，再后台刷新，不会闪空白。
- 冷启动耗时主要来自 `git status` 扫描大仓库工作树（本机约 200ms/个，7 个并行约 0.65s）；
  命中缓存后约 1ms。

## 颜色与对比度

chip 的正文色统一用 `--dsw-alias-label-secondary`（浅色 5.8:1 / 深色 10.4:1），状态只用圆点表达，
因为 `--dsw-alias-state-success-primary` 在白底只有 **2.28:1**、`warn` 只有 **2.15:1**，`error` 在白底
4.50:1、深色底 3.49:1——都不能作为小字号正文。破坏性动作同理：红色只用于边框/圆点，文字仍是
`--dsw-alias-label-primary`。
