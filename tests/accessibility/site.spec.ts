import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Locator } from '@playwright/test'

async function scan(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const reportPath = test.info().outputPath('axe-review.json')
  await import('node:fs/promises').then((fs) =>
    fs.writeFile(
      reportPath,
      JSON.stringify(
        { violations: result.violations, incomplete: result.incomplete },
        null,
        2,
      ),
    ),
  )
  await test.info().attach('axe-review', {
    body: JSON.stringify(
      { violations: result.violations, incomplete: result.incomplete },
      null,
      2,
    ),
    contentType: 'application/json',
  })
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((n) => n.target),
    })),
  ).toEqual([])
}

async function reflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}

// Canvas resolves the browser's actual CSS colors, including OKLCH and alpha.
async function contrast(locator: Locator, property = 'color') {
  return locator.evaluate((element, property) => {
    const context = document.createElement('canvas').getContext('2d')!
    const rgba = (color: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
      return [...context.getImageData(0, 0, 1, 1).data]
    }
    const over = (a: number[], b: number[]) =>
      a.slice(0, 3).map((v, i) => (v * a[3]) / 255 + b[i] * (1 - a[3] / 255))
    const luminance = (color: number[]) =>
      color
        .slice(0, 3)
        .map((v) => {
          v /= 255
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
    let background = [255, 255, 255]
    const ancestors: Element[] = []
    for (let e: Element | null = element; e; e = e.parentElement)
      ancestors.unshift(e)
    for (const ancestor of ancestors)
      background = over(
        rgba(getComputedStyle(ancestor).backgroundColor),
        background,
      )
    const foreground = over(
      rgba(getComputedStyle(element).getPropertyValue(property)),
      background,
    )
    const a = luminance(foreground),
      b = luminance(background)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }, property)
}

for (const route of ['/', '/about', '/stories', '/contact']) {
  test(`${route} landmarks, names, contrast and reflow`, async ({ page }) => {
    await page.goto(route)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://yahalausa.net${route}`,
    )
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)
    await scan(page)
    await reflow(page)
    if (route === '/') {
      const action = page.getByRole('link', { name: 'Connect with Ya Hala' })
      await expect(action).toHaveAttribute('href', '/contact')
      expect(await contrast(action)).toBeGreaterThanOrEqual(4.5)
      await action.hover()
      await expect.poll(() => contrast(action)).toBeGreaterThanOrEqual(4.5)
      expect(
        await page
          .locator('.bento-scroll-track')
          .first()
          .evaluate((e) => getComputedStyle(e).animationName),
      ).toBe('none')
      const qr = page.getByRole('button', { name: 'Share with a QR code' })
      await qr.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Share this page' })
      await expect(dialog).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Close QR code' }),
      ).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(qr).toBeFocused()
    }
  })
}

test('contact validation, keyboard choices, draft and failure recovery', async ({
  page,
}) => {
  await page.goto('/contact')
  await expect(page.locator('h1')).toHaveText(
    'Let’s make the next story happen.',
  )
  const name = page.getByLabel('Your name (required)')
  await name.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Your email (required)')).toBeFocused()
  expect(
    await page
      .getByLabel('Your email (required)')
      .evaluate((e) => e.matches(':focus-visible')),
  ).toBe(true)
  const radios = page.getByRole('radio')
  await radios.first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('radio', { name: 'Feature my business', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('radio', { name: 'Feature my business', exact: true }),
  ).toBeFocused()
  const submit = page.getByRole('button', { name: 'Prepare my inquiry' })
  await submit.click()
  await expect(name).toBeFocused()
  await name.fill('Test Partner')
  await page.getByLabel('Your email (required)').fill('not-an-email')
  await page
    .getByLabel('What’s your idea? (required)')
    .fill('A community business story. '.repeat(15))
  await submit.click()
  await expect(page.getByLabel('Your email (required)')).toBeFocused()
  await page.getByLabel('Your email (required)').fill('partner@example.test')
  expect(await contrast(name, 'border-top-color')).toBeGreaterThanOrEqual(3)
  await submit.hover()
  await expect.poll(() => contrast(submit)).toBeGreaterThanOrEqual(4.5)
  await submit.click()
  await expect(page.getByRole('status')).toContainText('Nothing has been sent')
  await expect(page.getByLabel('Your prepared inquiry')).toHaveValue(
    /Feature my business/,
  )
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('Test clipboard denied')
        },
      },
    }),
  )
  await page.getByRole('button', { name: 'Copy inquiry' }).click()
  await expect(page.getByRole('status')).toContainText('Copying is unavailable')
  await expect(name).toHaveValue('Test Partner')
  await scan(page)
  await page.addStyleTag({
    content:
      'html{font-size:200%}main *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}main p{margin-bottom:2em!important}',
  })
  await reflow(page)
  for (const control of await page
    .locator('main input:not([type=radio]), main textarea, main button')
    .all()) {
    // Hidden anti-spam fields are intentionally outside the visual flow.
    if (
      await control.evaluate((e) =>
        Boolean(e.closest('[aria-hidden="true"], [inert]')),
      )
    )
      continue
    const bounds = await control.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    )
  }
  await page.emulateMedia({ forcedColors: 'active' })
  await expect(submit).toBeVisible()
  await expect(submit).toBeEnabled()
})
