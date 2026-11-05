# Worktrees — 工作区 + worktree 两级管理

给 DSH Web GUI 增加一个 Worktree 面板：在工作区里创建 Git worktree，在其中工作时把改动提交，
完成后一键合并回工作区，并可移除工作树与分支。

## 形态

- 侧边栏底部面板列表新增 **Worktree 管理** 图标，打开的是 `main` 面板。
- 面板按「工作区 → worktree」两级展示，每行显示分支、ahead/behind、未提交改动、是否已合并。
- 创建、合并、移除、加入侧边栏均走同一套 Host 逻辑。

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
```

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

[MIT](LICENSE) © 2026 liwang
