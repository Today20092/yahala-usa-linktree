import { expect, test, type Page } from '@playwright/test'

// Emulating prefers-color-scheme proves nothing unless the page renders that theme.
export async function expectProjectTheme(page: Page) {
  const dark = test.info().project.use.colorScheme === 'dark'
  await expect(page.locator('html')).toHaveClass(
    dark ? /(^|\s)dark(\s|$)/ : /(^|\s)light(\s|$)/,
  )
  const luminance = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('2d')!
    context.fillStyle = getComputedStyle(document.body).backgroundColor
    context.fillRect(0, 0, 1, 1)
    return [...context.getImageData(0, 0, 1, 1).data]
      .slice(0, 3)
      .map((v) => {
        v /= 255
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      })
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
  })
  if (dark) expect(luminance).toBeLessThan(0.05)
  else expect(luminance).toBeGreaterThan(0.8)
}
