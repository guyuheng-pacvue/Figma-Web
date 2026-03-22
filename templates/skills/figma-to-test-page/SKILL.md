---
name: figma-to-test-page
description: Generates a repo-root design.md from a Figma Design URL (fileKey + node-id) using a Figma API based MCP (figma-context / Framelink) with minimal token usage, then creates a Vue 3 page in web named testYYYYMMDDHHmm and registers a route. If design.md references components that exist in pacvue-element-plus docs (via web-fetch MCP to vue3-component.pacvue.com), replace custom UI with existing components/usages from the codebase or documented pacvue-element-plus components.
---

# Figma → `design.md` → Test Page（web）

## 适用场景

当用户说：
- “给你一个 Figma 链接/文件/节点，生成 `design.md`”
- “根据 `design.md` 直接生成页面”
- “页面名是 `test+当前年月日时分`”
- “`web-fetch` 能找到的组件直接替换（pacvue-element-plus）”

## 前置条件（必须检查）

- **Figma API MCP 已连接（优先）**：`figma-context` 可用（Framelink / Figma-Context-MCP，基于 Figma API token）。
  - 项目内推荐配置：`.cursor/mcp.json` 中存在 `figma-context`，并通过 `env.FIGMA_API_KEY` 提供 token。
- **官方 Figma MCP（兜底）**：`figma` 可用（remote MCP / OAuth）。仅在 `figma-context` 不可用时使用。
- **Web Fetch MCP 可用（用于组件替换）**：
  - `.cursor/mcp.json` 内存在 `web-fetch` 指向本地 SSE（示例：`http://127.0.0.1:8080/sse`）
  - 用户本机启动了抓取服务：`npx -y mcp-fetch-node`
  - 若 web-fetch 不可用：跳过“网页组件替换”，仅做“代码库内已有组件复用/替换”

### 配置规则：不要随意改动 `FIGMA_API_KEY`

- Skill 不应指导或自动修改仓库内 `.cursor/mcp.json` 的 `FIGMA_API_KEY`（避免误覆盖本地配置）。
- 如需配置 token，优先建议：
  - **用户级** `mcp.json`（个人环境，不入库），或
  - 通过启动环境变量注入（不落盘）

## 目标产物（固定）

1. 仓库根目录生成或更新：`design.md`
2. 生成一个新页面（Vue SFC）：
   - **页面名**：`testYYYYMMDDHHmm`（例如 `test202603220031`）
   - **目录**：`packages/main/src/views/Test202603220031/index.vue`（目录名用 `TestYYYYMMDDHHmm`，首字母大写以匹配现有 views 命名习惯）
3. 注册路由：
   - `packages/main/src/router/index.js` 增加一条 route
   - **path**：`/TestYYYYMMDDHHmm`
   - **name**：`TestYYYYMMDDHHmm`
   - meta 至少包含：`menu`, `parent`, `showBreadcrumb`, `i18Key`

> 重要：优先在 `packages/main/` 改动；不要随意修改 `packages/pacvue/`。

---

## 用户指定输出位置/命名规则（新增，覆盖默认行为）

当用户额外提供了“代码位置 / 路由 / 文件名”等信息时，**必须按用户指定优先**，覆盖默认的 `testYYYYMMDDHHmm` 约定。

### 1) 用户提供“代码位置 + Figma 链接”

如果用户同时提供：
- 一个代码位置（目录或文件路径），例如 `@packages/main/src/views/Foo/index.vue` 或 `@packages/main/src/assets/foo/`
- 一个 Figma URL（含 fileKey/node-id）

则优先执行“导出图片资源到该位置”，而不是立刻生成页面代码。

导出规则：
- 如果代码位置是目录：把图片导出到该目录
- 如果代码位置是文件：把图片导出到该文件所在目录
- 默认导出格式优先：SVG（icon/vector）→ PNG（位图/截图）
- 文件名默认：`figma-<fileKey>-<nodeId>.png`（nodeId 用 `:` 替换为 `-`）

实现路径（优先 figma-context）：
- 先用 `figma-context.get_figma_data(fileKey,nodeId)` 找到该 node 下的 image/icon 节点信息
- 对应节点用 `figma-context.download_figma_images({ fileKey, nodes, localPath })` 下载到指定目录
- 若该 node 仅能作为“截图/整帧预览”导出且当前 MCP 不支持直接 screenshot 导出，则提示用户改用官方 `figma` MCP 的 screenshot 工具或在 Figma 里导出 PNG

### 2) 用户提供“路由 + 文件名”

如果用户明确给出：
- routePath（例如 `/Foo/Bar` 或 `/TestCustom`）
- fileName（例如 `FooBar.vue` 或 `index.vue`）以及可选的 views 目录位置

则：
- 页面文件必须按用户指定的 `fileName` 创建
- 路由必须按用户指定的 `routePath` 注册
- route `name` 若用户未指定，则用文件名去扩展名后的 PascalCase（例如 `FooBar`）

### 3) 优先级

当出现冲突时，按以下优先级决定最终输出：

1. 用户明确指定的 **文件完整路径**（最高优先级）
2. 用户指定的 **目录 + fileName**
3. 用户指定的 **routePath + fileName**
4. 默认 `testYYYYMMDDHHmm`（最低优先级）

## 图表规则（Highcharts，新增）

如果设计/`design.md` 中出现任何图表（chart/line/area/column/bar/pie/bubble 等关键词或可视化区域），则：

- **必须优先使用 Highcharts 实现**（仓库已内置依赖 `highcharts` / `highcharts/highstock`）。
- **优先复用现有实现**：
  - Advertising 列表页场景优先使用 `PacvueCustomChart`（内部通过 `pacvue-chart` 统一渲染与交互）。
  - Dashboard/Home 小组件图表可参考现有 Highcharts 用法（例如 `packages/main/src/views/Home/components/LineChart.vue`、`AreasplineChart.vue`）。
- **不要引入新的图表库**（如 ECharts/Chart.js），也不要新增依赖。

落地要求：
- 生成页面时如果包含图表，至少提供：
  - 容器尺寸（width/height）
  - `options`（含 `chart.type`、`xAxis.categories`、`series`）
  - tooltip/legend 的基本可用交互（可参考 Home 组件的 formatter 模式）
- 如果 `design.md` 只有“图表占位”但无数据定义，允许先用 mock series（并在页面/文档中标注后续需要真实数据字段）。

## 全局布局跳过规则（新增）

如果 Figma 节点包含明显的“全局布局/壳”区域，则**不要在 test 页面里实现**这些部分（避免重复渲染、还原成本高且不属于页面核心逻辑）。

典型应跳过的内容：
- **Top bar / Header**（例如蓝色顶栏、logo、workspace pill、用户邮箱、消息/下载 icon）
- **Sidebar / Navigation**
- **Breadcrumb / Title bar**（面包屑、页面标题条，如果项目已有全局 breadcrumb）
- 任何与“全局框架”一致的通用壳层

处理方式：
- **在 `design.md` 里记录**这些区域存在即可（用于理解页面上下文）
- 页面实现只关注**主内容区**（filters/表格/表单/图表/卡片等）
- 路由 meta 需要 breadcrumb 时，用 `meta.showBreadcrumb/parent/i18Key` 让现有框架生成

## 分段切换（Segmented）控件规则（新增）

如果设计中出现 “segmented toggle / tabs-like switch / 双按钮切换” 的控件（例如 `Viewers` / `Purchasers`），则：

- **不要手写 button 组**（避免样式不一致）
- **必须优先使用组件库**：`pacvue-radio-group` + `pacvue-radio-button`

推荐写法：

```vue
<pacvue-radio-group v-model="mode">
  <pacvue-radio-button label="viewers">Viewers</pacvue-radio-button>
  <pacvue-radio-button label="purchasers">Purchasers</pacvue-radio-button>
</pacvue-radio-group>
```

配合逻辑：
- 用 `watch(() => mode.value, ...)` 或 `computed` 驱动图表/表格刷新（不要在 template 内写复杂逻辑）

## 工作流（强制步骤）

### Step A — 解析 Figma 输入（只接受一种输入也可）

输入可能是：
- Figma URL：`https://www.figma.com/design/:fileKey/...?...node-id=:nodeId`

解析规则：
- `fileKey`：URL 中的 `design/<fileKey>/...`
- `nodeId`：查询参数 `node-id=1706-29344` 需要转换成 `1706:29344`

### Step B — 低 token 拉取设计上下文（按优先级）

目标：生成 `design.md`，尽量避免一次性拉超大“参考代码”。

#### MCP 选择规则（新增，必须执行）

- 默认 **优先使用 `figma-context`**（Figma API 拉取，通常更稳定且不受官方 seat tool-call 限额影响）
- 仅当 `figma-context` 不可用/鉴权失败时，才使用官方 `figma` MCP

#### 截图节点保护规则（新增，必须执行）

如果发现该 node 本质上是“**一张截图/静态图片**”（没有可复用的真实组件层级），则：

- **立刻停止**后续所有高消耗拉取（尤其是任何会返回大量参考代码/层级的工具调用）
- **只返回提示**：告知用户这是截图节点，无法可靠生成可交互页面；请提供更细粒度的 frame/layer（例如列表区、编辑器区、表单区等）或真正的组件化节点

判定条件（满足任意一条即可视为截图节点）：

- 元数据结构里，主体 frame 下几乎只有 1 个大图层（常见为 `rounded-rectangle`/`rectangle`/`image`），名字包含 `截屏` / `screenshot` / 带日期时间截图命名，且尺寸接近 frame（例如 1920×987）
- 视觉预览显示为完整 UI 截图，但元数据中缺少可读的组件结构（大量矩形占位、无明确控件层级/文本层）

输出模板（直接照用即可）：

```markdown
已检测到该 Figma 节点为“截图/静态图片节点”，继续拉取设计上下文会浪费 token 且无法生成可靠的可交互页面。

请提供以下任意一种更合适的输入：
- 同页面中更细粒度的 frame/layer（比如 Query Editor 区、表格区、右侧助手面板等）对应的 Figma URL（带 node-id）
- 或者一个包含真实组件层级的 frame（不是截图图片）
```

按顺序调用（能满足就停止，缺什么再补）。对每一步，优先使用 `figma-context` 的等价工具；没有再用官方 `figma` MCP：

1. **metadata / structure**：拿到文件/节点结构概览（含 node 名称、尺寸、子节点类型与命名）
2. **screenshot / preview**：拿到视觉参考（用于快速判断是不是“截图节点”，以及后续对齐）
3. **variables / tokens**：拿到颜色/字体/token 定义（若文件使用 variables）
4. 仅当以上不足以写清结构时再用：
   - 拉取“设计上下文”（结构/文案/布局约束）
   - 只把它当作“结构/层级/文案/约束”参考，**不要把 React+Tailwind 代码照搬进项目**

### Step C — 生成 `design.md`（固定模板 + 可解析）

在仓库根目录生成 `design.md`，必须包含以下章节（标题固定，方便后续脚本化/半自动解析）：

```markdown
# Design Spec: <Page Title>

## Source
- figmaFileKey:
- figmaNodeId:
- figmaUrl:

## Page Naming
- pageName: testYYYYMMDDHHmm
- routePath: /TestYYYYMMDDHHmm

## Layout
### Top / Breadcrumb
### Left Column
### Right Column (if any)
### Footer actions

## Components (candidates)
- <ComponentName> - <purpose> - <docUrl?>

## Copy / i18n
- ...

## Validation / Rules
- ...

## Design Tokens
### Colors
### Typography
### Spacing / Radius / Shadow
```

要求：
- **Components (candidates)**：把设计里出现的组件候选写成清单（如 Drawer、Select、Table、Checkbox、Breadcrumb、Card 等）
- token 信息尽量从 variables/metadata 提取；没有就写设计中出现的 hex/字号/阴影数值

### Step D — “组件替换”策略（从强到弱）

对 `design.md` 的 `Components (candidates)` 逐个处理：

1. **代码库内已有实现优先**：
   - 在 `packages/main/src/` 里搜索是否已有相同页面/组件/用法（例如 `CreateAudience` 已存在时，优先复用其结构与组件）
2. **若 web-fetch 可用，则从 pacvue-element-plus 文档替换**：
   - 通过 web-fetch 抓取 `https://vue3-component.pacvue.com/` 及其对应组件页
   - 从文档中提炼“组件名、props、slots、示例用法”
   - 在生成页面时用这些现成组件替换纯 HTML/手写样式
3. **兜底**：用项目现有的 `pacvue-*` / `@pacvue/element-plus` 组件组合实现

> 关键原则：**能复用就不新造**；对齐项目既有风格与组件体系。

### Step E — 生成页面（`TestYYYYMMDDHHmm`）

页面实现要求：
- Vue 3 SFC，优先 `<script setup>`（项目允许 JS，则用 `<script setup>`；如 repo 已要求 TS 才用 `lang="ts"`）
- 使用项目现成布局容器（例如 `ContainerLayout` / `ContainerBorder` 等）以对齐样式
- 初版允许 UI-only mock，但必须把以下内容落地：
  - Layout（左右列、底部 sticky）
  - 表单控件/空态/按钮 disabled 规则（按 `design.md`）
  - i18n key：尽量使用 `$t()` 包裹

### Step F — 注册路由

在 `packages/main/src/router/index.js` 增加 route：
- 放在 Dashboard children 下即可（便于快速访问）
- meta 推荐：
  - `menu`: "Test"
  - `parent`: "Dashboard"
  - `showBreadcrumb`: true
  - `i18Key`: "Test"

### Step G — 校验

至少做到：
- 对新增页面与 router 文件做 lint（或 IDE lints 无错误）
- 如全仓 `pnpm lint` 本身有历史错误，允许只保证“本次改动文件无新增 lint”

---

## 交互约束（省 token / 可持续）

- 一旦 `design.md` 生成完成，后续迭代应尽量基于 `design.md`，**不要反复拉 Figma**。
- 只有当 `design.md` 缺信息或设计变更时，才增量拉取对应 node。

---

## 示例对话（用户给输入）

### 示例 1：从 Figma 链接生成

用户：
> 这是 Figma 链接：<url>。生成 design.md 并做一个 test 页面。

你要做：
- 解析 fileKey/nodeId
- 最小化拉取（metadata/screenshot/variables）
- 写 `design.md`
- 生成 `TestYYYYMMDDHHmm` 页面与路由
- 若 `web-fetch` 可用：对 `Components (candidates)` 做替换

### 示例 2：只基于 design.md 生成页面

用户：
> design.md 已经写好了，直接生成页面。

你要做：
- 从 `design.md` 读出 pageName/routePath/组件候选/规则
- 组件替换（代码库优先，其次 web-fetch 文档）
- 生成页面与路由

