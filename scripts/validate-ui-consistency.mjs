import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = path.resolve(process.env.UI_VALIDATE_ROOT ?? process.cwd())
const srcDir = path.join(rootDir, 'src')
const uiDir = path.join(srcDir, 'components', 'ui')
const pageDir = path.join(srcDir, 'pages')
const brandedPages = ['index', 'about', 'stories']
const sourceExtensions = new Set([
  '.astro',
  '.css',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
])
const violations = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)))
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function report(relative, message) {
  violations.push(`${relative}: ${message}`)
}

const files = await walk(srcDir)
const tokensPath = path.join(rootDir, 'tokens.css')
const tokens = await readFile(tokensPath, 'utf8')
const sharedTokens = new Set(
  [...tokens.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1]),
)

for (const file of files) {
  const text = await readFile(file, 'utf8')
  const relative = path.relative(rootDir, file)
  const isUiFile = file.startsWith(uiDir)
  const isPageFile = file.startsWith(pageDir)

  if (
    !isUiFile &&
    /import\s*{[^}]*\bPlay\b[^}]*}\s*from\s*['"]lucide-react['"]/.test(text)
  ) {
    report(
      relative,
      'import Play from lucide-react. Use shared IconBadge + inline SVG marker instead.',
    )
  }

  if (
    !isUiFile &&
    /heroicons:play(?:-20)?-solid/.test(text) &&
    !text.includes('IconBadge')
  ) {
    report(
      relative,
      'raw heroicons play icon. Use shared IconBadge for media/play markers.',
    )
  }

  if (!isUiFile && /shadow-\[/.test(text)) {
    report(
      relative,
      'arbitrary shadow utility. Move repeated surface styling to ui-surface-card or elevation tokens.',
    )
  }

  if (
    isPageFile &&
    /(bg|text|border)-\[#|bg-white\/95|bg-black\/10|shadow-\[/.test(text)
  ) {
    report(
      relative,
      'hardcoded color or shadow in page file. Use tokens/shared primitives instead.',
    )
  }

  if (path.extname(file) === '.css') {
    for (const match of text.matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
      if (sharedTokens.has(match[1])) {
        report(
          relative,
          `${match[1]} duplicates the shared declaration in tokens.css.`,
        )
      }
    }
  }
}

const layoutRelative = path.join('src', 'layouts', 'BrandedPageDocument.astro')
const layout = await readFile(path.join(rootDir, layoutRelative), 'utf8')

for (const required of ["import '../styles.css'", "import '../atlas.css'"]) {
  if (!layout.includes(required)) {
    report(layoutRelative, `missing production styling seam: ${required}.`)
  }
}

for (const previewArtifact of ['design-preview', 'data-design', 'field', 'night']) {
  if (layout.includes(previewArtifact)) {
    report(layoutRelative, `production document references ${previewArtifact}.`)
  }
}

for (const page of brandedPages) {
  const relative = path.join('src', 'pages', `${page}.astro`)
  const source = await readFile(path.join(rootDir, relative), 'utf8')

  if (
    !source.includes(
      "import BrandedPageDocument from '../layouts/BrandedPageDocument.astro'",
    ) ||
    !source.includes('<BrandedPageDocument')
  ) {
    report(relative, 'branded page must render through BrandedPageDocument.')
  }

  if (
    source.includes("import '../styles.css'") ||
    source.includes("import '../atlas.css'")
  ) {
    report(relative, 'production style imports belong to BrandedPageDocument.')
  }
}

const atlasRelative = path.join('src', 'atlas.css')
const atlas = await readFile(path.join(rootDir, atlasRelative), 'utf8')
for (const forbidden of [
  'data-design',
  'design-preview',
  '.reach-summary',
  '.visited-state-picker',
]) {
  if (atlas.includes(forbidden)) {
    report(atlasRelative, `${forbidden} belongs outside the global Atlas seam.`)
  }
}

const indexCssRelative = path.join('src', 'pages', 'index.css')
const indexCss = await readFile(path.join(rootDir, indexCssRelative), 'utf8')
for (const featureSelector of ['.reach-summary', '.visited-state-picker']) {
  if (!indexCss.includes(featureSelector)) {
    report(indexCssRelative, `missing owned feature selector ${featureSelector}.`)
  }
}

if (violations.length > 0) {
  console.error('UI consistency check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`UI consistency check passed: ${files.length} source files scanned.`)
