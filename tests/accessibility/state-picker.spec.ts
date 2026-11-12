import { expect, test } from '@playwright/test'

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
      await expect(state).toBeVisible()
      await state.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/stories\?state=Illinois$/)
    })
  })
}
