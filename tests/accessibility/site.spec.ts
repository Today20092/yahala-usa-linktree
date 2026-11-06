import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Locator } from '@playwright/test'
import storySnapshot from '../../src/data/story-view-snapshot.json' with { type: 'json' }
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

// Keep verification and delivery deterministic; no real inquiry leaves the test.
test.beforeEach(async ({ page }) => {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `let options;
        window.turnstile = {
          render(element, value) { options = value; queueMicrotask(() => options.callback('test-token')); return 'test-widget'; },
          reset() { queueMicrotask(() => options.callback('test-token')); },
          remove() {}
        };`,
      }),
  )
  await page.route('**/api/partnership', (route) =>
    route.fulfill({ status: 503, json: { code: 'unavailable' } }),
  )
})

async function scan(page: Page, selector?: string) {
  const builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
  ])
  if (selector) builder.include(selector)
  const result = await builder.analyze()
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
    if (['mobile-light', 'desktop-light'].includes(test.info().project.name)) {
      await page.screenshot({
        path: test.info().outputPath('route.png'),
        fullPage: true,
      })
    }
    if (route === '/') {
      const action = page
        .getByRole('link', { name: 'Partner with us', exact: true })
        .first()
      await expect(action).toHaveAttribute('href', '/contact')
      expect(await contrast(action)).toBeGreaterThanOrEqual(4.5)
      await action.hover()
      await expect.poll(() => contrast(action)).toBeGreaterThanOrEqual(4.5)
      expect(
        await page
          .locator('.bento-video-link')
          .first()
          .evaluate((e) => getComputedStyle(e).transitionDuration),
      ).toBe('0s')
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

test('contact validation, keyboard choices, failure recovery and sending', async ({
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
  const submit = page.getByRole('button', { name: 'Send my inquiry' })
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
  await expect(page.getByRole('alert')).toContainText('Nothing has been sent')
  await expect(name).toHaveValue('Test Partner')
  await expect(
    page.getByRole('radio', { name: 'Feature my business', exact: true }),
  ).toBeChecked()
  await expect(
    page.locator('main a[href^="mailto:"], main a[href*="instagram.com"]'),
  ).toHaveCount(0)
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

  let requests = 0
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  await page.route('**/api/partnership', async (route) => {
    requests++
    expect(route.request().postDataJSON()).toMatchObject({
      interest: 'Feature my business',
      name: 'Test Partner',
      turnstileToken: 'test-token',
    })
    await pending
    await route.fulfill({ json: { ok: true } })
  })
  await submit.click()
  await expect(page.getByRole('button', { name: 'Sending…' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  await page.keyboard.press('Enter')
  await expect.poll(() => requests).toBe(1)
  finish()
  await expect(page.getByRole('status')).toContainText('Your inquiry was sent')
  await expect(name).toHaveValue('')
  await expect(
    page.getByRole('radio', { name: 'Sponsor a video', exact: true }),
  ).toBeChecked()
})

test('contact preserves details through server and network failures', async ({
  page,
}) => {
  await page.goto('/contact')
  await page.getByLabel('Your name (required)').fill('Test Partner')
  await page.getByLabel('Your email (required)').fill('partner@example.test')
  await page
    .getByLabel('What’s your idea? (required)')
    .fill('A business story in Tampa.')
  const cases = [
    {
      status: 400,
      body: { errors: { message: 'Please describe your idea.' } },
      text: 'Please check your details',
    },
    {
      status: 403,
      body: { code: 'verification' },
      text: 'security check didn’t pass',
    },
    {
      status: 502,
      body: { code: 'delivery' },
      text: 'couldn’t send your inquiry',
    },
    { status: 404, body: null, text: 'couldn’t confirm delivery' },
    { status: 0, body: null, text: 'couldn’t confirm delivery' },
  ]
  for (const item of cases) {
    await page.route('**/api/partnership', (route) =>
      item.status === 0
        ? route.abort()
        : route.fulfill({ status: item.status, json: item.body }),
    )
    await page.getByRole('button', { name: 'Send my inquiry' }).click()
    await expect(page.getByRole('alert')).toContainText(item.text)
    await expect(page.getByLabel('Your name (required)')).toHaveValue(
      'Test Partner',
    )
    await expect(page.getByLabel('What’s your idea? (required)')).toHaveValue(
      'A business story in Tampa.',
    )
    await expect(page.getByRole('status')).not.toContainText('was sent')
    await expect(page).toHaveURL(/\/contact$/)
  }
})

test('contact retries a blocked security check without losing the inquiry', async ({
  page,
}) => {
  await page.route(
    'https://challenges.cloudflare.com/turnstile/v0/api.js*',
    (route) => route.abort(),
    { times: 1 },
  )
  await page.goto('/contact')
  await expect(page.getByRole('alert')).toContainText(
    'security check couldn’t load',
  )
  await page.getByLabel('Your name (required)').fill('Test Partner')
  await page.getByLabel('Your email (required)').fill('partner@example.test')
  await page
    .getByLabel('What’s your idea? (required)')
    .fill('A business story in Tampa.')
  await page.getByRole('button', { name: 'Send my inquiry' }).click()
  await expect(page.getByRole('status')).toContainText(
    'Retrying the security check',
  )
  await expect(page.getByLabel('Your name (required)')).toHaveValue(
    'Test Partner',
  )
  await page.route('**/api/partnership', (route) =>
    route.fulfill({ json: { ok: true } }),
  )
  await page.getByRole('button', { name: 'Send my inquiry' }).click()
  await expect(page.getByRole('status')).toContainText('Your inquiry was sent')
})

test('mapcn business pins, grouped locations and keyboard popups', async ({
  page,
}) => {
  // Isolate marker behavior from external basemap availability.
  await page.route('https://basemaps.cartocdn.com/gl/**/style.json', (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#eeeeee' },
          },
        ],
      },
    }),
  )
  await page.goto('/stories?state=Virginia&city=Alexandria&view=map')
  const map = page.getByRole('region', { name: 'Map', exact: true })
  const business = map.getByRole('button', { name: /Islamic Relief USA/ })
  await expect(business).toBeVisible({ timeout: 20000 })
  await expect(page.locator('[data-selected-map-label]')).toHaveCount(0)
  const tooltip = page.getByRole('tooltip')
  await business.hover()
  await expect(tooltip).toHaveText('Islamic Relief USA')
  expect(await contrast(tooltip)).toBeGreaterThanOrEqual(4.5)
  await tooltip.hover()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
  await page.mouse.move(0, 0)
  await business.focus()
  await expect(tooltip).toHaveText('Islamic Relief USA')
  await expect(business).toHaveAccessibleDescription('Islamic Relief USA')
  await page.keyboard.press('Tab')
  await expect(tooltip).toHaveCount(0)
  await business.focus()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
  await expect(business).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(tooltip).toHaveCount(0)
  await expect(
    map.getByText('3655 Wheeler Ave, Alexandria, VA 22304', { exact: true }),
  ).toBeVisible()
  await expect(
    map.getByRole('link', { name: 'Open address in maps' }),
  ).toHaveAttribute('href', /3655/)
  await expect(
    map
      .getByRole('link', { name: /Open on YouTube|Islamic Relief|Gaza|غزة/i })
      .first(),
  ).toBeVisible()
  await scan(page, '.story-map-shell')
  await reflow(page)
  const shellBounds = await page.locator('.story-map-shell').boundingBox()
  const popupBounds = await page
    .locator('.maplibregl-popup-content')
    .boundingBox()
  expect(popupBounds!.y).toBeGreaterThanOrEqual(shellBounds!.y)
  expect(popupBounds!.y + popupBounds!.height).toBeLessThanOrEqual(
    shellBounds!.y + shellBounds!.height,
  )
  await page.keyboard.press('Escape')
  await expect(map.getByRole('button', { name: 'Close popup' })).toHaveCount(0)
  await expect(business).toBeFocused()
  await expect(page.locator('[data-selected-map-label]')).toHaveText(
    'Islamic Relief USA',
  )
  expect(
    await contrast(page.locator('[data-selected-map-label]')),
  ).toBeGreaterThanOrEqual(4.5)
  await expect(tooltip).toHaveCount(0)
  await map.getByRole('button', { name: 'Expand map' }).click()
  const dialog = page.getByRole('dialog', { name: 'Expanded story map' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Islamic Relief USA/ }).focus()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tooltip).toHaveCount(0)
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await page.goto('/stories?view=map')
  await expect(page.locator('[data-selected-map-label]')).toHaveCount(0)
  const cluster = page
    .getByRole('button', { name: /\d+ locations\. Zoom in/ })
    .first()
  await expect(cluster).toBeVisible({ timeout: 20000 })
  expect(await contrast(cluster)).toBeGreaterThanOrEqual(4.5)
  await cluster.hover()
  expect(await contrast(cluster)).toBeGreaterThanOrEqual(4.5)
  const clusterId = await cluster.getAttribute('data-map-pin')
  await cluster.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator(`[data-map-pin="${clusterId}"]`)).toHaveCount(0)
  await expect(page.locator('[data-map-pin]:focus')).toHaveCount(1)
  await expect(
    page.getByText('All stories remain in the list.', { exact: false }),
  ).toBeVisible()
  await page.goto('/')
  const homeMap = page.locator('.story-map-shell')
  await homeMap.scrollIntoViewIfNeeded()
  await expect(homeMap.locator('[data-map-pin]').first()).toBeVisible({
    timeout: 20000,
  })
})

test('mapcn failure keeps the story list available', async ({ page }) => {
  await page.route('https://basemaps.cartocdn.com/gl/**/style.json', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  )
  await page.goto('/stories?view=map')
  await expect(page.getByRole('alert')).toContainText(
    'The map is unavailable right now.',
    { timeout: 20000 },
  )
  await expect(
    page.getByRole('button', { name: 'Zoom in', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: /Inside Lipari Foods/ }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload map' })).toBeVisible()
})

test('all collaboration brands load local logos under the production image policy', async ({
  page,
}) => {
  const brands: { name: string; logo: string }[] = parse(
    readFileSync(new URL('../../src/data/site.yaml', import.meta.url), 'utf8'),
  ).collaborationBrands
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': "img-src 'self' data:",
      },
    })
  })
  await page.goto('/')
  const section = page.locator('.brand-marquee')
  const items = section.locator('ul:not([aria-hidden="true"]) > li')
  await expect(items).toHaveCount(brands.length)
  await expect(items.locator('img')).toHaveCount(brands.length)
  for (const brand of brands) {
    expect(brand.logo, `${brand.name}: local logo required`).toMatch(
      /^\/brands\//,
    )
    const item = items.filter({
      has: page.getByText(brand.name, { exact: true }),
    })
    await item.scrollIntoViewIfNeeded()
    const image = item.locator('img')
    await expect(image).toHaveAttribute('src', brand.logo)
    await expect(image).toBeVisible()
    await expect
      .poll(
        () =>
          image.evaluate(
            (img: HTMLImageElement) =>
              img.complete && img.naturalWidth > 0 && img.naturalHeight > 0,
          ),
        { message: `${brand.name}: logo must decode` },
      )
      .toBe(true)
  }
  await scan(page, '.brand-marquee')
  await reflow(page)
  await section.screenshot({
    path: test.info().outputPath('collaboration-logos.png'),
  })
})

test('collaboration logos preload without changing the scrolling row widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  let releaseLogos!: () => void
  const logosReady = new Promise<void>((resolve) => {
    releaseLogos = resolve
  })
  await page.route('**/brands/*', async (route) => {
    await logosReady
    await route.continue()
  })
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    const section = page.locator('.brand-marquee')
    await section.scrollIntoViewIfNeeded()
    const groups = section.locator('.brand-marquee__group')
    const widths = () =>
      groups.evaluateAll((elements) =>
        elements.map((element) => element.clientWidth),
      )
    const before = await widths()
    releaseLogos()
    // Both copies must load, including logos still outside the clipped viewport.
    await expect
      .poll(() =>
        section.locator('img').evaluateAll((images) =>
          images.every((image) => {
            const img = image as HTMLImageElement
            return img.complete && img.naturalWidth > 0
          }),
        ),
      )
      .toBe(true)
    expect(await widths()).toEqual(before)
    expect(before[0]).toBe(before[1])
    expect(before[2]).toBe(before[3])
    await reflow(page)
    await section.getByRole('button', { name: 'Pause motion' }).click()
    await expect(section.locator('.brand-marquee__track').first()).toHaveCSS(
      'animation-play-state',
      'paused',
    )
  } finally {
    releaseLogos()
  }
})

test('portfolio uses curated titles, verified locations and consistent proof', async ({
  page,
}) => {
  await page.goto('/stories')
  await expect(
    page.getByRole('heading', {
      name: 'Inside Lipari Foods: bringing Arab products to American stores',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'King Chicken: a family restaurant in Dearborn, Michigan',
      exact: true,
    }),
  ).toBeVisible()
  const orlandoStory = page
    .locator('a[href="https://www.youtube.com/watch?v=kEWWAKPE22s"]')
    .first()
  await expect(orlandoStory).toContainText('Orlando, FL')
  await page.goto('/stories?state=Ohio&city=Columbus')
  await expect(
    page
      .locator('a[href="https://www.youtube.com/watch?v=c1JGUAQ-aoY"]')
      .first(),
  ).toContainText('Columbus, OH')
  await page.goto('/')
  const topStory = storySnapshot.entries[0]
  const featured = page
    .locator(
      'a[href="https://www.youtube.com/watch?v=' + topStory.videoId + '"]',
    )
    .filter({ hasText: 'views' })
    .first()
  await expect(featured).toContainText(
    new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(topStory.views) + ' views',
  )
  await page.goto('/about')
  await expect(page.locator('[data-most-watched-stories]')).toContainText(
    new Intl.NumberFormat('en-US').format(topStory.views) + ' views',
  )
})
