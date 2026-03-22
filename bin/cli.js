#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function getArgv() {
  return process.argv.slice(2);
}

function parseFlags(argv) {
  const flags = {};
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (!a.startsWith('--')) {
      positionals.push(a);
      continue;
    }

    const eq = a.indexOf('=');
    if (eq !== -1) {
      flags[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }

    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }

  return { flags, positionals };
}

function printHelp() {
  const msg = `
figma-web - 技能模板生成器

用法:
  figma-web list
  figma-web new-skill <template> [outputDir] [--name <skillName>] [--description <text>]

例子:
  figma-web list
  figma-web new-skill web ./my-skill --name "web" --description "通用 Web 开发技能"
  figma-web new-skill figma-to-test-page
`;
  process.stdout.write(msg.trimStart());
  process.stdout.write('\n');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function listTemplates(templatesDir) {
  if (!fs.existsSync(templatesDir)) return [];
  return fs
    .readdirSync(templatesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeText(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? `{{${k}}}`));
}

function resolveRepoRoot() {
  return path.resolve(__dirname, '..');
}

function main() {
  const argv = getArgv();
  const { flags, positionals } = parseFlags(argv);

  const cmd = positionals[0];
  const repoRoot = resolveRepoRoot();
  const templatesDir = path.join(repoRoot, 'templates', 'skills');

  if (!cmd || flags.help || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    printHelp();
    process.exit(0);
  }

  if (cmd === 'list') {
    const templates = listTemplates(templatesDir);
    if (templates.length === 0) {
      process.stdout.write(`未找到模板目录: ${templatesDir}\n`);
      process.exit(1);
    }
    process.stdout.write(templates.join('\n'));
    process.stdout.write('\n');
    process.exit(0);
  }

  if (cmd === 'new-skill') {
    const templateName = positionals[1];
    const outputDirRaw = positionals[2];

    if (!templateName) {
      process.stderr.write('缺少 <template>。用 `figma-web list` 查看可用模板。\n');
      process.exit(1);
    }

    const templateSkillPath = path.join(templatesDir, templateName, 'SKILL.md');
    if (!fs.existsSync(templateSkillPath)) {
      process.stderr.write(`模板不存在: ${templateName}\n`);
      process.stderr.write('用 `figma-web list` 查看可用模板。\n');
      process.exit(1);
    }

    const outputDir = path.resolve(process.cwd(), outputDirRaw || `./${templateName}`);
    const skillName = typeof flags.name === 'string' ? flags.name : templateName;
    const description =
      typeof flags.description === 'string' ? flags.description : '（请填写技能描述）';

    const now = new Date();
    const vars = {
      YEAR: String(now.getFullYear()),
      SKILL_NAME: skillName,
      SKILL_SLUG: templateName,
      SKILL_DESCRIPTION: description
    };

    const src = readText(templateSkillPath);
    const out = renderTemplate(src, vars);

    ensureDir(outputDir);
    const outSkillPath = path.join(outputDir, 'SKILL.md');
    writeText(outSkillPath, out);

    process.stdout.write(`已生成: ${outSkillPath}\n`);
    process.exit(0);
  }

  process.stderr.write(`未知命令: ${cmd}\n`);
  printHelp();
  process.exit(1);
}

main();

