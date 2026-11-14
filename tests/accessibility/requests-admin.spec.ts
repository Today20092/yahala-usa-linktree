import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const row = (id: string, status: string, name: string, message: string) => ({
  id: `00000000-0000-4000-8000-00000000010${id}`,
  interest: 'Sponsor a video',
  name,
  email: `${id}@example.com`,
  phone: id === '1' ? '+1 (813) 555-0142' : '',
  business: id === '1' ? 'Test fixture market' : '',
  location: 'Tampa, FL',
  message,
  status,
  created_at: '2026-11-01 12:00:00',
  updated_at: status === 'new' ? null : '2026-11-02 12:00:00',
  archived_at: status === 'archived' ? '2026-11-02 12:00:00' : null,
})

async function scan(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    window.scrollTo({ top: 0, behavior: 'instant' })
  })
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  await test.info().attach('axe-review', {
    body: JSON.stringify({
      violations: result.violations,
      incomplete: result.incomplete,
    }),
    contentType: 'application/json',
  })
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    })),
  ).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}

test('admin works through saved contact requests', async ({ page }) => {
  const posts: { action: string }[] = []
  await page.route('**/api/admin/requests', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: {
          requests: [
            row(
              '1',
              'new',
              'Nadia Test',
              'We would love to sponsor an episode.',
            ),
            row('2', 'replied', 'يوسف تجريبي', 'شكراً لكم. '.repeat(40).trim()),
          ],
          reviewer: 'admin@example.com',
        },
      })
    posts.push(route.request().postDataJSON())
    return route.fulfill({ json: { ok: true } })
  })
  await page.goto('/admin/requests')
  await expect(page.getByRole('link', { name: 'Requests' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByRole('tab', { name: /New/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  const reply = page.getByRole('link', { name: 'Reply by email to Nadia Test' })
  await expect(reply).toHaveAttribute(
    'href',
    /^mailto:1@example\.com\?subject=Re%3A%20Sponsor%20a%20video/,
  )
  await expect(
    page.getByRole('link', { name: '+1 (813) 555-0142' }),
  ).toHaveAttribute('href', 'tel:+18135550142')
  await scan(page)

  await page.getByRole('button', { name: 'Mark replied' }).click()
  await expect(page.getByText('Marked replied')).toBeVisible()
  expect(posts.at(-1)).toMatchObject({ action: 'replied' })
  await expect(page.getByText('No new requests')).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  expect(posts.at(-1)).toMatchObject({ action: 'new' })
  await page.mouse.move(0, 0)
  await expect(page.locator('[data-slot=toast-title]')).toHaveCount(0, {
    timeout: 10000,
  })

  await page.getByRole('tab', { name: /Replied/ }).click()
  const panel = page.getByRole('tabpanel', { name: /Replied/ })
  await panel.getByRole('button', { name: 'Read full message' }).click()
  await panel.getByRole('button', { name: 'Archive' }).click()
  await expect(
    page.getByText('will be deleted automatically in 12 months'),
  ).toBeVisible()
  expect(posts.at(-1)).toMatchObject({ action: 'archived' })
  await page.mouse.move(0, 0)
  await expect(page.locator('[data-slot=toast-title]')).toHaveCount(0, {
    timeout: 10000,
  })

  await page.getByRole('tab', { name: /Archived/ }).click()
  await expect(page.getByRole('tabpanel', { name: /Archived/ })).toContainText(
    'Deletes',
  )
  await page
    .getByRole('button', { name: 'More actions for يوسف تجريبي' })
    .click()
  await page.getByRole('menuitem', { name: 'Delete permanently' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('The original email stays in your inbox')
  await scan(page)
  await dialog.getByRole('button', { name: 'Delete permanently' }).click()
  await expect(page.getByText('was permanently removed')).toBeVisible()
  expect(posts.at(-1)).toMatchObject({ action: 'delete' })
})

test('admin requests explain a missing Access sign-in', async ({ page }) => {
  await page.route('**/api/admin/requests', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await page.goto('/admin/requests')
  await expect(page.getByRole('alert')).toContainText('You’re not signed in')
  await scan(page)
})
