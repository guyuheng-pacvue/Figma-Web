# guyuheng-progress

## 2026-03-22
- 目标：补齐一个最小可用的技能模板仓库结构（CLI + templates）。
- 已添加：
  - `package.json`：声明 `bin` 命令 `figma-web`，Node >= 18。
  - `bin/cli.js`：支持 `list` 与 `new-skill` 两个命令；从 `templates/skills/<template>/SKILL.md` 渲染到输出目录；支持变量 `{{SKILL_NAME}}`/`{{SKILL_DESCRIPTION}}`/`{{SKILL_SLUG}}`/`{{YEAR}}`。
  - 模板：
    - `templates/skills/web/SKILL.md`
    - `templates/skills/figma-to-test-page/SKILL.md`
  - `README.md`：补充用法与模板变量说明。

## 待办（如需要再做）
- 给 `bin/cli.js` 在 git 中设置可执行位（`chmod +x bin/cli.js`）。
- 若后续要发布为 npm 包：补充 `name/version/license/repository`，并移除 `private`。
