import { expect, test } from '@playwright/test'

test.describe('State picker without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('opens the selected state with keyboard submission', async ({
    page,
  }) => {
    await page.goto('/')
    const select = page.locator('select[name="state"]')
    await expect(select).toBeVisible()
    await page.getByRole('button', { name: 'View stories' }).click()
    await expect(select).toBeFocused()
    await expect(page).toHaveURL('/')
    await select.selectOption('Illinois')
    await select.focus()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'View stories' }),
    ).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/stories\?state=Illinois$/)
  })
})

test('enhances the unused picker without navigating on selection', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('.visited-state-picker').scrollIntoViewIfNeeded()
  await page
    .getByRole('combobox', { name: 'Browse stories by state' })
    .and(page.locator('input'))
    .fill('Illinois')
  await page.getByRole('option', { name: /^Illinois/ }).click()
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Browse stories in Illinois' }).click()
  await expect(page).toHaveURL(/\/stories\?state=Illinois$/)
})

test('hydration preserves an active native state picker', async ({ page }) => {
  let releaseScripts!: () => void
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve
  })
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'script') await scriptsReady
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  const select = page.locator('select[name="state"]')
  await select.scrollIntoViewIfNeeded()
  await select.selectOption('Illinois')
  await select.focus()
  releaseScripts()
  await expect(
    page.locator('astro-island[component-url*="VisitedPlacesExplorer"]'),
  ).not.toHaveAttribute('ssr')
  await expect(select).toHaveValue('Illinois')
  await expect(select).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/stories\?state=Illinois$/)
})
