# Figma-Web
figma 落地前端：一个极简的 CLI，用来生成 Cursor Agent Skill 模板（`SKILL.md`）。

## 目录结构
- `bin/cli.js`: CLI 入口（`figma-web`）
- `templates/skills/*/SKILL.md`: 技能模板

## 本地使用
列出可用模板：

```bash
node bin/cli.js list
```

基于模板生成一个技能目录（默认生成到 `./<template>/SKILL.md`）：

```bash
node bin/cli.js new-skill web
```

指定输出目录 + 替换技能名/描述：

```bash
node bin/cli.js new-skill figma-to-test-page ./my-skill --name "figma-to-test-page" --description "把 Figma 落地成可验证测试页"
```

## 模板变量
模板内支持以下占位符：
- `{{SKILL_NAME}}`
- `{{SKILL_DESCRIPTION}}`
- `{{SKILL_SLUG}}`
- `{{YEAR}}`
