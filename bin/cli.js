#!/usr/bin/env node
 
const fs = require("fs")
const path = require("path")
 
function parseArgs(argv) {
  const options = {
    target: process.cwd(),
    force: false,
    figmaApiKey: process.env.FIGMA_API_KEY || "",
    webFetchUrl: "http://127.0.0.1:8080/sse",
  }
 
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--target" && argv[i + 1]) {
      options.target = path.resolve(argv[i + 1]); i++; continue
    }
    if (arg === "--figma-api-key" && argv[i + 1]) {
      options.figmaApiKey = argv[i + 1]; i++; continue
    }
    if (arg === "--web-fetch-url" && argv[i + 1]) {
      options.webFetchUrl = argv[i + 1]; i++; continue
    }
    if (arg === "--force") {
      options.force = true; continue
    }
  }
  return options
}
 
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8")
}
function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  } catch {
    return null
  }
}
function copyFile(src, dest, overwrite) {
  if (!overwrite && fs.existsSync(dest)) return false
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
  return true
}
 
function main() {
  const args = parseArgs(process.argv.slice(2))
  const cwd = process.cwd()
  const baseDir = path.resolve(__dirname, "..")
  const templateSkillDir = path.join(baseDir, "templates", "skills")
  const cursorDir = path.join(args.target, ".cursor")
  const skillsDir = path.join(cursorDir, "skills")
  ensureDir(skillsDir)
 
  const defaultMcpConfig = {
    mcpServers: {
      figma: { url: "https://mcp.figma.com/mcp" },
      "figma-context": {
        command: "npx",
        args: ["-y", "figma-developer-mcp", "--stdio"],
        env: { FIGMA_API_KEY: args.figmaApiKey || "PLEASE_SET_FIGMA_API_KEY" }
      },
      "web-fetch": { url: args.webFetchUrl }
    }
  }
 
  const mcpFile = path.join(cursorDir, "mcp.json")
  if (fs.existsSync(mcpFile) && !args.force) {
    const existing = readJson(mcpFile)
    if (existing && typeof existing === "object") {
      writeJson(mcpFile, {
        ...existing,
        mcpServers: { ...(existing.mcpServers || {}), ...defaultMcpConfig.mcpServers }
      })
      console.log(`merged ${path.relative(cwd, mcpFile)}`)
    } else {
      console.log(`skip ${path.relative(cwd, mcpFile)} (invalid JSON, use --force to overwrite)`)
    }
  } else {
    ensureDir(cursorDir)
    writeJson(mcpFile, defaultMcpConfig)
    console.log(`wrote ${path.relative(cwd, mcpFile)}`)
  }
 
  const skillFiles = [
    {
      src: path.join(templateSkillDir, "figma-to-test-page", "SKILL.md"),
      dest: path.join(skillsDir, "figma-to-test-page", "SKILL.md"),
    },
    {
      src: path.join(templateSkillDir, "web", "SKILL.md"),
      dest: path.join(skillsDir, "web", "SKILL.md"),
    },
  ]
 
  for (const item of skillFiles) {
    const wrote = copyFile(item.src, item.dest, args.force)
    console.log(
      wrote
        ? `wrote ${path.relative(cwd, item.dest)}`
        : `skip ${path.relative(cwd, item.dest)} (exists, use --force to overwrite)`
    )
  }
 
  if (!args.figmaApiKey) {
    console.log("\ntip: set FIGMA_API_KEY by --figma-api-key <token> or environment variable FIGMA_API_KEY")
  }
}
 
main()