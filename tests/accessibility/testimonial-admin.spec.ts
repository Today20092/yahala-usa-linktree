import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const row = (id: string, status: string, name: string, quote: string) => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  name,
  role: 'Test fixture business',
  quote,
  rating: 5,
  status,
  consent_at: '2026-11-01 12:00:00',
  reviewed_at: status === 'pending' ? null : '2026-11-02 12:00:00',
  review_expires: status === 'pending' ? 0 : Date.now(),
})
const fixtures = () => [
  row(
    '1',
    'pending',
    'عميل تجريبي',
    'تجربة رائعة مع فريق ياهلا، ساعدونا في مشاركة قصة عملنا.',
  ),
  row(
    '2',
    'approved',
    'Published Client',
    'Wonderful team. '.repeat(30).trim(),
  ),
]

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

test('admin moderates testimonials with undo, confirmation and focus kept in the list', async ({
  page,
}) => {
  const posts: unknown[] = []
  await page.route('**/api/admin/testimonials', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: { testimonials: fixtures(), reviewer: 'admin@example.com' },
      })
    posts.push(route.request().postDataJSON())
    return route.fulfill({ json: { ok: true } })
  })
  await page.goto('/admin')
  const tabs = page.getByRole('tablist')
  await expect(page.getByRole('tab', { name: /Pending/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(page.getByText('admin@example.com')).toBeVisible()
  await expect(page.getByText('Email link expired')).toBeVisible()
  // Every tab fits inside the tab bar with its label on one line, even at 320px.
  expect(
    await tabs.evaluate((list) => {
      const box = list.getBoundingClientRect()
      return [...list.querySelectorAll('[role=tab]')].every((tab) => {
        const r = tab.getBoundingClientRect()
        const label = document.createRange()
        label.selectNodeContents(tab.firstChild as Node)
        return (
          r.left >= box.left - 0.5 &&
          r.right <= box.right + 0.5 &&
          label.getClientRects().length === 1
        )
      })
    }),
  ).toBe(true)
  await scan(page)

  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page.getByText('is now on the homepage')).toBeVisible()
  expect(posts.at(-1)).toMatchObject({ action: 'approved' })
  await expect(page.getByText('No pending testimonials')).toBeVisible()
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe(
    'BODY',
  )

  // Arrow keys move between tabs, as in any tablist.
  await tabs.getByRole('tab', { name: /Pending/ }).focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  const published = page.getByRole('tabpanel')
  const hideButtons = published.getByRole('button', { name: 'Hide from site' })
  await expect(hideButtons).toHaveCount(2)
  await published.getByRole('button', { name: 'Read full quote' }).click()
  await expect(
    published.getByRole('button', { name: 'Show less' }),
  ).toHaveAttribute('aria-expanded', 'true')

  await hideButtons.first().click()
  await expect(page.getByText('Moved to Hidden')).toBeVisible()
  await expect(hideButtons).toHaveCount(1)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(hideButtons).toHaveCount(2)
  expect(posts.at(-1)).toMatchObject({ action: 'approved' })
  // Hovering pauses toasts; move away so they time out as they do on touch screens.
  await page.mouse.move(0, 0)
  await expect(page.locator('[data-slot=toast-title]')).toHaveCount(0, {
    timeout: 10000,
  })

  await page
    .getByRole('button', { name: 'More actions for Published Client' })
    .click()
  await page.getByRole('menuitem', { name: 'Delete permanently' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Delete this testimonial?')
  await scan(page)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  expect(
    posts.some((post) => (post as { action: string }).action === 'delete'),
  ).toBe(false)

  await page
    .getByRole('button', { name: 'More actions for Published Client' })
    .click()
  await page.getByRole('menuitem', { name: 'Delete permanently' }).click()
  await dialog.getByRole('button', { name: 'Delete permanently' }).click()
  await expect(page.getByText('was permanently removed')).toBeVisible()
  expect(posts.at(-1)).toMatchObject({ action: 'delete' })
})

test('admin explains a missing Access sign-in', async ({ page }) => {
  await page.route('**/api/admin/testimonials', (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await page.goto('/admin')
  await expect(page.getByRole('alert')).toContainText('You’re not signed in')
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
  await scan(page)
})
