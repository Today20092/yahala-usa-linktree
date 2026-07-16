import { access, readFile } from 'node:fs/promises'
import path from 'node:path'

const target = process.argv[2]

if (!target) {
  console.error('Usage: npm run smoke:preview -- <dist-directory|preview-url>')
  process.exit(1)
}

const assetPaths = (html) =>
  [
    ...new Set([
      ...[
        ...html.matchAll(
          /\b(?:src|href)=["']([^"']+?\.(?:css|js)(?:[?#][^"']*)?)["']/gi,
        ),
      ].map(([, asset]) => asset),
      ...[
        ...html.matchAll(/\/[^\s"'`<>]+?\.(?:css|js)(?:\?[^\s"'`<>]*)?/g),
      ].map(([asset]) => asset),
    ]),
  ].filter((asset) => !/^(?:https?:)?\/\//.test(asset))

const journeyMarkers = [
  ['reach section', 'data-reach-card'],
  ['QR interaction', 'id="qr-open"'],
  ['map', 'aria-label="Map"'],
  ['state selection', 'Choose a state'],
  ['latest-story action', 'Latest From Ya Hala'],
]

const assertJourney = (html) => {
  const missing = journeyMarkers
    .filter(([, marker]) => !html.includes(marker))
    .map(([name]) => name)

  if (missing.length)
    throw new Error(`Missing smoke journey: ${missing.join(', ')}`)
}

const expectedContentType = (asset) =>
  asset.split(/[?#]/, 1)[0].endsWith('.css') ? 'text/css' : 'javascript'

const checkDirectory = async (directory) => {
  const root = path.resolve(directory)
  const html = await readFile(path.join(root, 'index.html'), 'utf8')
  const assets = assetPaths(html)

  if (!assets.length)
    throw new Error('Production HTML references no CSS or JavaScript assets')
  assertJourney(html)

  await Promise.all(
    assets.map(async (asset) => {
      const pathname = decodeURIComponent(
        new URL(asset, 'https://local.invalid').pathname,
      )
      const file = path.resolve(root, `.${pathname}`)
      if (!file.startsWith(`${root}${path.sep}`))
        throw new Error(`Unsafe asset path: ${asset}`)
      await access(file)
    }),
  )

  return { assets, csp: 'not applied to local build output' }
}

const checkUrl = async (url) => {
  const page = await fetch(url, { redirect: 'follow' })
  if (!page.ok) throw new Error(`HTML returned ${page.status}: ${page.url}`)
  if (!page.headers.get('content-type')?.includes('text/html')) {
    throw new Error(
      `HTML has wrong content type: ${page.headers.get('content-type')}`,
    )
  }

  const html = await page.text()
  const assets = assetPaths(html)
  if (!assets.length)
    throw new Error('Production HTML references no CSS or JavaScript assets')
  assertJourney(html)

  await Promise.all(
    assets.map(async (asset) => {
      const assetUrl = new URL(asset, page.url)
      const response = await fetch(assetUrl, { redirect: 'follow' })
      if (!response.ok)
        throw new Error(`${assetUrl} returned ${response.status}`)

      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes(expectedContentType(asset))) {
        throw new Error(
          `${assetUrl} has wrong content type: ${contentType || 'missing'}`,
        )
      }
    }),
  )

  return {
    assets,
    csp: page.headers.has('content-security-policy') ? 'present' : 'missing',
  }
}

try {
  const result = /^https?:\/\//.test(target)
    ? await checkUrl(target)
    : await checkDirectory(target)
  console.log(
    `Preview smoke passed: ${result.assets.length} assets; reach, QR, map, state selection, and latest story present; CSP ${result.csp}.`,
  )
} catch (error) {
  console.error(`Preview smoke failed: ${error.message}`)
  process.exitCode = 1
}
