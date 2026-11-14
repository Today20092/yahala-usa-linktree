import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { findRawColors } from './ui-color-rules.mjs'

const messages = (text, file = 'src/components/Example.tsx') =>
  findRawColors(text, file).map((finding) => finding.message)

assert.match(
  messages('<p class="text-white">')[0],
  /"text-white"\. Use text-primary-foreground/,
)
assert.match(
  messages('<div className="bg-black/40">')[0],
  /bg-\(--color-scrim\)\/40/,
)
assert.match(
  messages('<path className="fill-red-500" />')[0],
  /fill-destructive/,
)
assert.match(messages('<span class="border-gray-200">')[0], /border-border/)
assert.match(messages('<div class="bg-[#123456]">')[0], /arbitrary color value/)
assert.equal(messages('<div class="bg-[#123456]">').length, 1)
assert.match(messages("color: '#4285F4',")[0], /raw hex color "#4285F4"/)
assert.match(
  messages('box-shadow: 0 1px oklch(0 0 0 / 10%);', 'src/x.css')[0],
  /raw color function/,
)
assert.match(messages("fill: 'rgba(0, 0, 0, 0)'")[0], /raw color function/)
for (const clean of [
  '<a href="#add">',
  'color: color-mix(in oklch, var(--primary) 80%, transparent);',
  '<p class="text-muted-foreground bg-primary/10 border-border">',
  '&#123;',
  '// default: "#4285F4"',
  "color = '#4285F4', // ui-color-allow: MapLibre paint cannot read CSS variables",
  "// ui-color-allow: QR raster\ncolor: '#fff',",
]) {
  assert.deepEqual(messages(clean), [], clean)
}
assert.equal(
  messages("color: '#fff', // ui-color-allow:").length,
  1,
  'marker needs a reason',
)
assert.deepEqual(findRawColors('--x: oklch(1 0 0);', 'tokens.css'), [])
assert.deepEqual(findRawColors('--x: #fff;', 'src/styles/tokens.css'), [])
assert.equal(findRawColors('--x: #fff;', 'src/styles.css').length, 1)

const rootDir = process.cwd()
const fixtureDir = await mkdtemp(path.join(tmpdir(), 'yahala-ui-validator-'))

async function runValidator() {
  return spawnSync(
    process.execPath,
    [path.join(rootDir, 'scripts', 'validate-ui-consistency.mjs')],
    {
      encoding: 'utf8',
      env: { ...process.env, UI_VALIDATE_ROOT: fixtureDir },
    },
  )
}

async function expectFailure(relative, change, message) {
  const file = path.join(fixtureDir, relative)
  const original = await readFile(file, 'utf8')
  await writeFile(file, change(original))
  const result = await runValidator()
  await writeFile(file, original)

  if (result.status === 0 || !result.stderr.includes(message)) {
    throw new Error(`${relative} mutation was not rejected: ${result.stderr}`)
  }
}

try {
  for (const relative of [
    'tokens.css',
    'src/atlas.css',
    'src/pages/index.css',
    'src/pages/index.astro',
    'src/pages/about.astro',
    'src/pages/stories.astro',
    'src/layouts/BrandedPageDocument.astro',
  ]) {
    await cp(path.join(rootDir, relative), path.join(fixtureDir, relative), {
      recursive: true,
    })
  }

  // Raw-color debt in copied files is owned by the token migration; only architecture must be clean.
  const baseline = await runValidator()
  const architectural = baseline.stderr
    .split('Raw colors')[0]
    .split('\n')
    .filter((line) => line.startsWith('- '))
  if (architectural.length > 0) throw new Error(baseline.stderr)

  await expectFailure(
    'src/pages/about.astro',
    (source) => source.replace('<BrandedPageDocument', '<main'),
    'branded page must render through BrandedPageDocument',
  )
  await expectFailure(
    'src/atlas.css',
    (source) => `${source}\n.reach-summary { color: red; }\n`,
    '.reach-summary belongs outside the global Atlas seam',
  )
  await expectFailure(
    'src/pages/index.css',
    (source) => `${source}\n:root {\n  --color-paper: red;\n}\n`,
    '--color-paper duplicates the shared declaration in tokens.css',
  )

  await expectFailure(
    'src/pages/about.astro',
    (source) => `${source}\n<p class="text-gray-500">x</p>\n`,
    'Tailwind palette class "text-gray-500". Use text-muted-foreground.',
  )

  console.log(
    'UI consistency validator rejects architecture regressions and raw colors.',
  )
} finally {
  await rm(fixtureDir, { recursive: true, force: true })
}
