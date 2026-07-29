import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

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

  const baseline = await runValidator()
  if (baseline.status !== 0) throw new Error(baseline.stderr)

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

  console.log('UI consistency validator rejects architecture regressions.')
} finally {
  await rm(fixtureDir, { recursive: true, force: true })
}
