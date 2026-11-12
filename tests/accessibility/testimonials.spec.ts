import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const quote =
  'تجربة رائعة مع فريق ياهلا، ساعدونا في مشاركة قصة عملنا مع المجتمع.'
const fixture = {
  id: 'test-fixture',
  name: 'عميل تجريبي',
  role: 'Test fixture business',
  quote,
  rating: 5,
}

async function scan(page: Page) {
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

test.beforeEach(async ({ page }) => {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `let options; window.turnstile = {
      render(element, value) { options = value; queueMicrotask(() => options.callback('test-token')); return 'test-widget'; },
      reset() { queueMicrotask(() => options.callback('test-token')); }, remove() {}
    };`,
      }),
  )
})

test('testimonial bilingual form requires consent, preserves errors and sends for review', async ({
  page,
}) => {
  let submissions = 0
  await page.route('**/api/testimonials', async (route) => {
    submissions++
    const value = route.request().postDataJSON()
    expect(value.consent).toBe(true)
    expect(value.rating).toBe(5)
    expect(value.quote).toBe(quote)
    await route.fulfill(
      submissions === 1
        ? { status: 502, json: { error: 'failed' } }
        : { status: 201, json: { ok: true } },
    )
  })
  await page.goto('/testimonial')
  await page.locator('#testimonial-name').fill(fixture.name)
  await page.locator('#testimonial-role').fill(fixture.role)
  await page.locator('#testimonial-quote').fill(quote)
  const submit = page.getByRole('button', {
    name: 'Send testimonial / إرسال الشهادة',
    exact: true,
  })
  await expect(submit).toBeEnabled()
  await page.getByRole('checkbox').check()
  await submit.click()
  expect(submissions).toBe(0)
  await page.getByRole('radio', { name: /^4/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: /^5/ })).toBeChecked()
  await page.getByRole('checkbox').uncheck()
  await submit.click()
  expect(submissions).toBe(0)
  await page.getByRole('checkbox').check()
  await scan(page)
  await page.screenshot({
    path: test.info().outputPath('testimonial-form.png'),
    fullPage: true,
  })
  await submit.click()
  await expect(page.getByRole('alert')).toContainText(
    'Your testimonial was not sent',
  )
  await expect(page.locator('#testimonial-quote')).toHaveValue(quote)
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(
    page.getByRole('heading', {
      name: 'Thank you for sharing your experience.',
    }),
  ).toBeFocused()
  await expect(
    page.getByText('Your testimonial has been sent to Ya Hala for review.', {
      exact: false,
    }),
  ).toBeVisible()
  await scan(page)
  expect(submissions).toBe(2)
})

test('testimonial email review previews without publishing and confirms once', async ({
  page,
}) => {
  const actions: string[] = []
  await page.route('**/api/testimonials/review', async (route) => {
    const value = route.request().postDataJSON()
    actions.push(value.action)
    await route.fulfill({
      json:
        value.action === 'preview' ? { testimonial: fixture } : { ok: true },
    })
  })
  await page.goto(
    '/testimonial/review#00000000-0000-4000-8000-000000000000.' +
      'f'.repeat(64) +
      '.approved',
  )
  await expect(page.getByRole('blockquote')).toContainText(quote)
  expect(actions).toEqual(['preview'])
  expect(new URL(page.url()).hash).toBe('')
  await scan(page)
  await page.screenshot({
    path: test.info().outputPath('testimonial-review.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Confirm approval' }).click()
  await expect(page.getByRole('status')).toContainText('Approved.')
  expect(actions).toEqual(['preview', 'approved'])
  await scan(page)
})

test('testimonial review handles expired links and rejection', async ({
  page,
}) => {
  await page.route('**/api/testimonials/review', (route) =>
    route.fulfill({ status: 410, json: { error: 'expired' } }),
  )
  const link =
    '/testimonial/review#00000000-0000-4000-8000-000000000000.' +
    'f'.repeat(64) +
    '.rejected'
  await page.goto(link)
  await expect(page.getByRole('alert')).toContainText('This link has expired')
  await expect(
    page.getByRole('button', { name: 'Confirm approval' }),
  ).toHaveCount(0)
  await page.route('**/api/testimonials/review', (route) =>
    route.fulfill({
      json:
        route.request().postDataJSON().action === 'preview'
          ? { testimonial: fixture }
          : { ok: true },
    }),
  )
  await page.goto(link)
  await page.getByRole('button', { name: 'Confirm rejection' }).click()
  await expect(page.getByRole('status')).toContainText('Rejected.')
})

test('approved testimonial carousel precedes partnership CTA and supports keyboard', async ({
  page,
}) => {
  await page.route('**/api/testimonials', (route) =>
    route.fulfill({
      json: {
        testimonials: Array.from({ length: 4 }, (_, index) => ({
          ...fixture,
          id: String(index),
          name: `Test client ${index + 1}`,
        })),
      },
    }),
  )
  await page.goto('/')
  const heading = page.getByRole('heading', { name: 'In our clients’ words' })
  await expect(heading).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Client testimonials' }),
  ).toBeVisible()
  expect(
    await heading.evaluate((element) =>
      Boolean(
        element.compareDocumentPosition(
          document.querySelector('.contact-cta') ??
            document.getElementById('contact')!,
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ),
  ).toBe(true)
  await heading.scrollIntoViewIfNeeded()
  await scan(page)
  await page.screenshot({
    path: test.info().outputPath('testimonial-carousel.png'),
    fullPage: true,
  })
  const next = page.getByRole('button', { name: 'Next slide' })
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(next).toBeFocused()
  await page.keyboard.press('ArrowLeft')
})

test('long client names and businesses wrap in carousel and review', async ({
  page,
}) => {
  const long = { ...fixture, name: 'N'.repeat(100), role: 'B'.repeat(150) }
  await page.route('**/api/testimonials', (route) =>
    route.fulfill({ json: { testimonials: [long] } }),
  )
  await page.goto('/')
  const header = page
    .locator('[data-slot="card-header"]')
    .filter({ hasText: long.name })
  await expect(header).toBeVisible()
  expect(
    await header.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true)
  await page.route('**/api/testimonials/review', (route) =>
    route.fulfill({ json: { testimonial: long } }),
  )
  await page.goto(
    '/testimonial/review#00000000-0000-4000-8000-000000000000.' +
      'f'.repeat(64) +
      '.approved',
  )
  await expect(page.locator('figcaption')).toContainText(long.name)
  expect(
    await page
      .locator('figure')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
