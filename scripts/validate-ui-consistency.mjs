import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')
const uiDir = path.join(srcDir, 'components', 'ui')
const pageDir = path.join(srcDir, 'pages')

const sourceExtensions = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx'])
const violations = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
      continue
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

const files = await walk(srcDir)

for (const file of files) {
  const text = await readFile(file, 'utf8')
  const relative = path.relative(rootDir, file)
  const isUiFile = file.startsWith(uiDir)
  const isPageFile = file.startsWith(pageDir)

  if (
    !isUiFile &&
    /import\s*{[^}]*\bPlay\b[^}]*}\s*from\s*['"]lucide-react['"]/.test(text)
  ) {
    violations.push(
      `${relative}: import Play from lucide-react. Use shared IconBadge + inline SVG marker instead.`,
    )
  }

  if (
    !isUiFile &&
    /heroicons:play(?:-20)?-solid/.test(text) &&
    !text.includes('IconBadge')
  ) {
    violations.push(
      `${relative}: raw heroicons play icon. Use shared IconBadge for media/play markers.`,
    )
  }

  if (
    !isUiFile &&
    /shadow-\[/.test(text)
  ) {
    violations.push(
      `${relative}: arbitrary shadow utility. Move repeated surface styling to ui-surface-card or elevation tokens.`,
    )
  }

  if (
    isPageFile &&
    /(bg|text|border)-\[#|bg-white\/95|bg-black\/10|shadow-\[/.test(text)
  ) {
    violations.push(
      `${relative}: hardcoded color or shadow in page file. Use tokens/shared primitives instead.`,
    )
  }
}

if (violations.length > 0) {
  console.error('UI consistency check failed:')
  for (const violation of violations) {
    console.error(`- ${violation}`)
  }
  process.exit(1)
}

console.log(`UI consistency check passed: ${files.length} source files scanned.`)
