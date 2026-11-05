import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const pages = ['index', 'about', 'stories', 'contact']

for (const page of pages) {
  const source = await readFile(`src/pages/${page}.astro`, 'utf8')

  if (
    !source.includes(
      "import BrandedPageDocument from '../layouts/BrandedPageDocument.astro'",
    )
  ) {
    throw new Error(`${page}.astro must use BrandedPageDocument`)
  }

  if (
    source.includes("import '../styles.css'") ||
    source.includes("import '../atlas.css'")
  ) {
    throw new Error(`${page}.astro must not own production style imports`)
  }

  if (
    !source.includes('<BrandedPageDocument') ||
    source.includes('<!doctype html>')
  ) {
    throw new Error(`${page}.astro must render through BrandedPageDocument`)
  }
}

const storiesPage = await readFile('src/pages/stories.astro', 'utf8')
const navigation = await readFile(
  'src/components/LandingNavigation.tsx',
  'utf8',
)

if (storiesPage.includes('bodyClass="linktree-page')) {
  throw new Error('stories.astro must not inherit Linktree page spacing')
}

for (const destination of ['Watch', 'Stories', 'Follow', 'About', 'Contact']) {
  if (!navigation.includes(`label: '${destination}'`)) {
    throw new Error(`Shared navigation must link to ${destination}`)
  }
}

const layout = await readFile('src/layouts/BrandedPageDocument.astro', 'utf8')

for (const invariant of [
  "import '../styles.css'",
  "import '../atlas.css'",
  '<!doctype html>',
  'name="viewport"',
  '<slot name="head" />',
  '<slot />',
  '<EditorialHeader />',
]) {
  if (!layout.includes(invariant)) {
    throw new Error(`BrandedPageDocument is missing ${invariant}`)
  }
}

if (!layout.includes('class="box-border light"')) {
  throw new Error('BrandedPageDocument must activate the light Atlas theme')
}

for (const previewArtifact of [
  'design-preview.css',
  'data-design-preview',
  'data-design=',
  'requestedDesign',
]) {
  if (layout.includes(previewArtifact)) {
    throw new Error(
      `BrandedPageDocument must not depend on preview artifact ${previewArtifact}`,
    )
  }
}

const atlas = await readFile('src/atlas.css', 'utf8')
const tokens = await readFile('tokens.css', 'utf8')

if (!atlas.includes('color-scheme: light')) {
  throw new Error('Atlas styling must declare a light browser color scheme')
}

if (!/:root\s*{[\s\S]*?--color-paper:/.test(tokens)) {
  throw new Error('Atlas color tokens must be active at :root')
}

for (const alternateDesign of ['data-design', 'field', 'night']) {
  if (atlas.includes(alternateDesign)) {
    throw new Error(`Atlas styling must not depend on ${alternateDesign}`)
  }
}

const buildPages = async (token) => {
  const outDir = await mkdtemp(path.join(tmpdir(), 'beacon-test-'))
  try {
    execFileSync(
      process.execPath,
      ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', outDir],
      {
        env: { ...process.env, PUBLIC_CF_BEACON_TOKEN: token },
        stdio: 'pipe',
      },
    )
    return Object.fromEntries(
      await Promise.all(
        pages.map(async (page) => [
          page,
          await readFile(
            path.join(outDir, page === 'index' ? '' : page, 'index.html'),
            'utf8',
          ),
        ]),
      ),
    )
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
}

const beaconScripts = (html) =>
  html.match(/<script\b[^>]*static\.cloudflareinsights\.com[^>]*>/g) ?? []

const yamlToken = (await readFile('src/data/site.yaml', 'utf8')).match(
  /^\s*cloudflareBeaconToken:\s*['"]?([^'"\s#]*)/m,
)?.[1]

// Skip the empty case once the owner commits a real token to site.yaml.
if (yamlToken === '') {
  for (const [page, html] of Object.entries(await buildPages(''))) {
    if (beaconScripts(html).length) {
      throw new Error(`${page} must render no analytics script without a token`)
    }
  }
}

const testToken = 'test0token0123456789abcdef012345'
const builtPages = await buildPages(testToken)
for (const [page, html] of Object.entries(builtPages)) {
  const scripts = beaconScripts(html)
  const attribute = scripts[0]?.match(/data-cf-beacon="([^"]*)"/)?.[1]
  const token =
    attribute &&
    JSON.parse(attribute.replaceAll('&#34;', '"').replaceAll('&quot;', '"'))
      .token

  if (
    scripts.length !== 1 ||
    !scripts[0].includes(
      'src="https://static.cloudflareinsights.com/beacon.min.js"',
    ) ||
    token !== testToken
  ) {
    throw new Error(`${page} must render exactly one beacon with the token`)
  }
}

// Per-page share images: each built page advertises its own absolute
// og:image/twitter:image, and that file is committed in public/og at 1200x630.
for (const page of pages) {
  const html = builtPages[page]

  for (const [key, property] of [
    ['property', 'og:image'],
    ['name', 'twitter:image'],
  ]) {
    const url = html.match(
      new RegExp(`<meta ${key}="${property}" content="([^"]+)"`),
    )?.[1]

    if (!url?.startsWith('https://')) {
      throw new Error(`${page} ${property} must be an absolute URL, got ${url}`)
    }

    const file = new URL(url).pathname
    if (file !== `/og/${page}.png`) {
      throw new Error(
        `${page} ${property} is ${file}, expected /og/${page}.png`,
      )
    }

    const { width, height } = await sharp(`public${file}`).metadata()
    if (width !== 1200 || height !== 630) {
      throw new Error(`public${file} is ${width}x${height}, not 1200x630`)
    }
  }

  for (const property of ['og:image:width', 'og:image:height']) {
    if (!html.includes(`property="${property}"`)) {
      throw new Error(`${page} is missing ${property}`)
    }
  }
}

console.log('Branded page document seam is consistent.')
