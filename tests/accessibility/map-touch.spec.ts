import { expect, test, type CDPSession, type Page } from '@playwright/test'

test.use({ hasTouch: true, isMobile: true })

type TouchPoint = { x: number; y: number; id: number }

async function gesture(
  session: CDPSession,
  page: Page,
  from: TouchPoint[],
  to: TouchPoint[],
) {
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: from,
  })
  for (let step = 1; step <= 8; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: from.map((point, index) => ({
        id: point.id,
        x: point.x + ((to[index].x - point.x) * step) / 8,
        y: point.y + ((to[index].y - point.y) * step) / 8,
      })),
    })
    await page.evaluate(() => new Promise(requestAnimationFrame))
  }
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
}

test('touch gestures pan, pinch, scroll and expand the map', async ({
  page,
  context,
}) => {
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
  const shell = page.locator('.story-map-shell')
  const pin = page.locator('.story-map-marker')
  await expect(pin).toBeVisible({ timeout: 20000 })
  await shell.evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(
    page.getByText(
      'Use two fingers to move the map or pinch to zoom. Expand the map to move it with one finger.',
    ),
  ).toBeVisible()
  const session = await context.newCDPSession(page)
  const canvas = page.locator('.maplibregl-canvas-container')
  await expect(canvas).toHaveCSS('touch-action', 'pan-x pan-y')
  const bounds = await shell.boundingBox()
  const x = bounds!.x + bounds!.width / 2
  const y = bounds!.y + bounds!.height / 2
  // A two-finger drag must move a geographic marker within the embedded map.
  const relativeX = () =>
    pin.evaluate((element) => {
      const marker = element.getBoundingClientRect()
      const map = element.closest('.story-map-shell')!.getBoundingClientRect()
      return marker.x - map.x
    })
  const originalX = await relativeX()
  await gesture(
    session,
    page,
    [
      { x: x - 30, y: y + 40, id: 1 },
      { x: x + 30, y: y + 40, id: 2 },
    ],
    [
      { x: x, y: y + 40, id: 1 },
      { x: x + 60, y: y + 40, id: 2 },
    ],
  )
  await expect.poll(relativeX).toBeGreaterThan(originalX + 15)

  // A symmetric pinch changes scale without rotating or tilting the map.
  const beforePinch = await relativeX()
  await gesture(
    session,
    page,
    [
      { x: x - 25, y: y + 50, id: 1 },
      { x: x + 25, y: y + 50, id: 2 },
    ],
    [
      { x: x - 50, y: y + 50, id: 1 },
      { x: x + 50, y: y + 50, id: 2 },
    ],
  )
  await expect
    .poll(async () => Math.abs((await relativeX()) - beforePinch))
    .toBeGreaterThan(8)

  // One-finger swipes over the embedded map must scroll the document.
  const beforeScroll = await page.evaluate(() => scrollY)
  await gesture(
    session,
    page,
    [{ x: x - 90, y: y + 65, id: 1 }],
    [{ x: x - 90, y: y - 25, id: 1 }],
  )
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(beforeScroll + 20)

  await shell.getByRole('button', { name: 'Expand map' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Expanded story map' }),
  ).toBeVisible()
  await expect(pin).toBeVisible()
  await expect(canvas).toHaveCSS('touch-action', 'none')
  const expandedBounds = await shell.boundingBox()
  const expandedX = expandedBounds!.width / 2
  const expandedY = expandedBounds!.height / 2 + 50
  const beforeDrag = await relativeX()
  await gesture(
    session,
    page,
    [{ x: expandedX - 70, y: expandedY, id: 1 }],
    [{ x: expandedX - 30, y: expandedY, id: 1 }],
  )
  await expect.poll(relativeX).toBeGreaterThan(beforeDrag + 20)
  await shell.getByRole('button', { name: 'Collapse map' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(canvas).toHaveCSS('touch-action', 'pan-x pan-y')
  await session.detach()
  await pin.tap()
  await expect(page.getByRole('button', { name: 'Close popup' })).toBeVisible()
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await page.getByRole('button', { name: 'Close popup' }).tap()
  await expect(page.locator('[data-selected-map-label]')).toHaveText(
    'Islamic Relief USA',
  )
})
