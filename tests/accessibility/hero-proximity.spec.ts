import { expect, test } from '@playwright/test'

test('hero weight follows the mouse without moving letters and resets on exit', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const heading = page.locator('#intro-title')
  await expect(heading).toHaveAccessibleName(
    'Arab-American stories, coast to coast.',
  )
  const letter = heading.locator('[data-letter]').first()
  const glyph = letter.locator('span')
  const before = await letter.boundingBox()
  if (!before) throw new Error('Hero letter is missing')
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  )
  await expect
    .poll(() =>
      glyph.evaluate((el) => getComputedStyle(el).fontVariationSettings),
    )
    .toMatch(/"wght" (7\d\d|800)/)
  expect(await letter.boundingBox()).toEqual(before)
  await page.mouse.move(0, 0)
  await expect(glyph).toHaveCSS('font-variation-settings', '"wght" 200')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  )
  await expect(glyph).toHaveCSS('font-variation-settings', 'normal')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(() =>
    document.documentElement.setAttribute('data-motion-paused', ''),
  )
  await expect(glyph).toHaveCSS('font-variation-settings', 'normal')
})

test('touch reveals the hero once and respects reduced motion', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 320, height: 800 },
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  await page.goto('/')
  const heading = page.locator('#intro-title')
  await expect(heading).toHaveAccessibleName(
    'Arab-American stories, coast to coast.',
  )
  await expect(heading.locator('[data-font-proximity]')).toBeHidden()
  const reveal = heading.locator('[data-text-reveal]')
  await expect(reveal).toBeVisible()
  await expect(reveal).toHaveClass(/text-reveal-visible/)
  await expect(reveal.locator('.text-reveal-word').first()).toHaveCSS(
    'animation-name',
    /text-reveal-generate/,
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(reveal.locator('.text-reveal-word').first()).toHaveCSS(
    'animation-name',
    'none',
  )
  await expect(heading).toBeVisible()
  await context.close()
})
