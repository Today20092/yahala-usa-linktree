import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('state grid expands on mobile and stays fully available on desktop', async ({
  page,
}) => {
  await page.goto('/')
  const coverage = page.getByRole('region', {
    name: 'Explore stories by state',
  })
  const toggle = coverage.getByRole('button')
  const items = coverage.locator('li')
  const count = await items.count()
  if (page.viewportSize()!.width >= 768) {
    await expect(toggle).toBeHidden()
    await expect(coverage.getByRole('link')).toHaveCount(count + 1)
    return
  }
  await expect(toggle).toHaveAccessibleName(`Show all ${count} states`)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(coverage.getByRole('link')).toHaveCount(9)
  const dimensions = await coverage.evaluate((section) => {
    const viewport = section
      .querySelector('.story-coverage__viewport')!
      .getBoundingClientRect()
    const rows = section.querySelectorAll('li')
    return {
      bottom: viewport.bottom,
      fourthRow: rows[7].getBoundingClientRect().bottom,
      fifthRow: rows[8].getBoundingClientRect().bottom,
    }
  })
  expect(dimensions.bottom).toBeGreaterThan(dimensions.fourthRow)
  expect(dimensions.bottom).toBeLessThan(dimensions.fifthRow)
  await items.nth(7).locator('a').focus()
  await page.keyboard.press('Tab')
  await expect(toggle).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAccessibleName('Show fewer states')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(coverage.getByRole('link')).toHaveCount(count + 1)
  expect(
    (await new AxeBuilder({ page }).include('.story-coverage').analyze())
      .violations,
  ).toEqual([])
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toBeFocused()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(toggle).toBeHidden()
  await expect(coverage.getByRole('link')).toHaveCount(count + 1)
  await page.setViewportSize({ width: 320, height: 800 })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

for (const javaScriptEnabled of [false, true]) {
  test.describe(`State browsing with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
    test.use({ javaScriptEnabled })

    test('opens a state from the flag grid with the keyboard', async ({
      page,
    }) => {
      await page.goto('/')
      const coverage = page.getByRole('region', {
        name: 'Explore stories by state',
      })
      const state = coverage.getByRole('link', { name: /Illinois/ })
      if (!javaScriptEnabled) {
        await expect(coverage.getByRole('button')).toBeHidden()
        await expect(coverage.getByRole('link')).toHaveCount(
          (await coverage.locator('li').count()) + 1,
        )
      }
      await expect(state).toBeVisible()
      await state.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/stories\?state=Illinois$/)
    })
  })
}
