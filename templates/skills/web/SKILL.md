---
name: web
description: 针对 web（Vue 3 + Vite + pnpm monorepo）的开发与变更指引。用于在此仓库中进行功能开发、Bug 修复、构建/发布排查、以及遵循“不要随意修改 packages/pacvue 框架包”等项目规范时自动应用。
---

# Web（web）项目技能

## 适用场景（何时使用）
- 用户提到 `web` / `Web` / `@pacvue/amazon` / `packages/main` / `pnpm dev` / `pnpm build` 等。
- 需要在 Vue 3 SFC（`.vue`）里实现功能、修 Bug、改 UI、排查构建问题。
- 涉及 monorepo 结构、pnpm workspace、以及不同环境构建（US/CN/EU/test）。

## 项目要点（必须遵守）
- **不要随意修改 `packages/pacvue/`**：它是核心架构框架包，需要评估风险、通用性与必要性。优先在 `packages/main/` 做业务侧改动。
- 代码主要在 **`packages/main/src/`**。
- 工具链：**pnpm workspace + Vue 3 + Vite**。

## 快速开始（默认工作流）
- **初始化（首次或子模块有变动）**：

```bash
pnpm initP
pnpm install --frozen-lockfile
pnpm initSVG
```

- **开发启动**：

```bash
pnpm dev
```

- **构建**（按需要选择）：

```bash
pnpm build   # US
pnpm cn
pnpm eu
pnpm test
```

## 常用命令（排查/质量）
- **ESLint**：

```bash
pnpm lint
```

- **提交（commitizen）**：

```bash
pnpm commit
```

## 目录与模块定位（怎么找代码）
- **主应用**：`packages/main/`（包名 `@pacvue/amazon`）
- **框架包**：`packages/pacvue/`（尽量不改）
- **工具包**：`packages/utils/`
- **入口与构建配置**：`packages/main/vite.config.mjs`

## 环境变量/配置（常见坑）
- 环境变量在 `env/` 下按 `mode+platform` 文件结构组织（例如 `development/amazon.json`、`production/amazon.json`、`test/amazon.json`）。
- 环境变量读取推荐使用：

```js
import { useEnv } from "@/utils/env"
const env = await useEnv()
```

## Vue 代码改动建议（默认最佳实践）
- 优先使用 **Vue 3 Composition API + `<script setup>`**。
- 尽量用 `computed` 表达派生状态，避免在 template 内写复杂逻辑。
- UI 组件多为 `pacvue-*` 组件或 `@pacvue/element-plus` 封装，改样式优先局部 scoped，避免全局污染。

## Advertising 模块页面骨架：`CampaignManagerLayout`
`CampaignManagerLayout`（`packages/main/src/components/CampaignManagerLayout/index.vue`）是 Advertising 下列表页的通用布局容器，默认组合了：
- **Total**：`PacvueCustomTotal`
- **Chart**：`PacvueCustomChart`
- **Filter/Query**：`PacvueCustomFilter`
- **Toolbar**：`ToolBar`（含 bulk bar / overflow bulk dropdown）
- **Table**：`PacvueCustomTable`

### 典型使用位置（Advertising）
常见于：
- `packages/main/src/views/Advertising/Campaign/index.vue`
- `packages/main/src/views/Advertising/Creative/index.vue`
- `packages/main/src/views/Advertising/AdGroup/index.vue`
- `packages/main/src/views/Advertising/Seed/index.vue`
- `packages/main/src/views/Advertising/Advertiser/index.vue`
- `packages/main/src/views/Advertising/ItemSet/index.vue`
- `packages/main/src/views/Advertising/Audience/index.vue`
- `packages/main/src/views/Advertising/Tagging/*/index.vue`

### 你通常要做什么（页面侧）
- **ToolBar 左侧按钮区**：用 `#ToolBarLeft` 插槽放 “Create / Assign / Bulk” 等按钮。
- **Bulk 操作按钮区**：用 `#selectTypeButtonContent` 插槽放 bulk 操作按钮（当表格有勾选行时显示 bulk bar；按钮过多时会自动收纳到 “More Bulk Edits” 下拉）。
- **表格单元格渲染**：用 `#cellItem` 插槽渲染业务字段（通常转发到页面内的 `TableBody` 组件）。
- **监听行选择变化**：在 `CampaignManagerLayout` 上监听 `@checkChange`，拿到 `{ allSelectType, checkSize }`。
- **监听行操作**：在 `CampaignManagerLayout` 上监听 `@actionClick`，处理 edit/archive/assign 等行为。

### 关键 Slots（高频）
- `#ToolBarLeft`
- `#selectTypeButtonContent`
- `#cellItem`
-（可选覆盖）`#total` / `#chart` / `#query` / `#toolbar` / `#table` / `#summaryItem` / `#headItem` / `#actionItem`

### 对外事件（页面监听）
- `@actionClick(payload)`：来自表格 action（内部转发 `PacvueCustomTable` 的 `actionClick`）
- `@checkChange({ allSelectType, checkSize })`：来自表格勾选变化（内部转发并规整字段）

### 对外暴露方法（ref 调用）
页面通常 `ref="campaignManagerLayoutRef"`，然后调用：
- `campaignManagerLayoutRef.value.search(value?, ifAll=true)`：触发刷新/搜索（多数页面 `refreshTable()` 用它）
- `campaignManagerLayoutRef.value.clearSelection()`：清空表格勾选
- `campaignManagerLayoutRef.value.resetFilterInfo(key, itemList?, options?, value?)`：动态重置某个 filter 的可选项/默认值
- `campaignManagerLayoutRef.value.getUrlFilterParams()`：从 URL 解析 filter 参数（一般不需要页面侧手动调）

### 页面侧推荐模板（最小可用）
当你在 Advertising 下新增一个列表页时，优先照这个结构搭起骨架：
1. `CampaignManagerLayout` + `ref`
2. `#ToolBarLeft` 放 Create 按钮
3. `#selectTypeButtonContent` 放 bulk 操作按钮（可根据是否同一 advertiser 做 disabled）
4. `#cellItem` 交给页面 `components/TableBody.vue`
5. `@checkChange` 保存 `checkSize`，`@actionClick` 处理 row action
6. `refreshTable()` 用 `campaignManagerLayoutRef.value.search(null, false)`

## 变更流程建议（给 Agent 的 checklist）
当需要实现一个 UI/逻辑需求时：
- 在 `packages/main/src/` 内定位页面/组件并修改（优先业务层）。
- 如果需要复用逻辑，优先提取到 `packages/main/src/utils` 或就近 composable（不侵入 `packages/pacvue/`）。
- 改完后运行 `pnpm lint`（至少针对改动文件/目录）。
- 保持提交信息遵循 **Conventional Commits** 且包含 **JIRA 票号**（例如 `fix: TTD-123 ...`）。

