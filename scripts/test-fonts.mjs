import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  const base = process.env.FONT_TEST_URL ?? 'http://localhost:4322'
  const fontRequests = []
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fontRequests.push(request.url())
  })
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', '/about', '/stories', '/contact']) {
      await page.goto(`${base}${route}`)
      for (const dark of [false, true]) {
        const result = await page.evaluate(async (dark) => {
          document.documentElement.classList.toggle('dark', dark)
          const faces = await document.fonts.load('800 32px "Manrope"')
          return {
            loaded:
              faces.length > 0 &&
              faces.every((face) => face.status === 'loaded'),
            families: [
              ...document.querySelectorAll(
                'body, h1, h2, h3, nav a, button, input, textarea, .typeset p',
              ),
            ].map((element) => getComputedStyle(element).fontFamily),
            picker: Boolean(document.querySelector('#font-preview')),
            overflow: document.documentElement.scrollWidth > innerWidth,
          }
        }, dark)
        assert.ok(result.loaded, `${route}: self-hosted Manrope loads`)
        assert.ok(
          result.families.every((family) => family.startsWith('Manrope')),
          `${route}: consistent type roles`,
        )
        assert.equal(result.picker, false, 'Temporary picker was removed')
        assert.equal(result.overflow, false, `${route}: ${width}px reflow`)
      }
    }
  }
  assert.ok(fontRequests.some((url) => url.includes('manrope-latin-wght')))
  assert.ok(
    fontRequests.every((url) => new URL(url).origin === new URL(base).origin),
    'Font files must be self-hosted',
  )
  assert.ok(
    fontRequests.every((url) => !/newsreader|jakarta|geist/i.test(url)),
    'Previous fonts must not load',
  )
  console.log(
    'Manrope loads locally across all four routes, text roles, mobile/desktop widths and light/dark states; comparison UI and prior font loads are absent.',
  )
} finally {
  await browser.close()
}
