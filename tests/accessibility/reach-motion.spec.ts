import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

const { socialReach } = parse(readFileSync('src/data/site.yaml', 'utf8'))
const total = Math.floor(
  socialReach.items.reduce(
    (sum: number, item: { value: number }) => sum + item.value,
    0,
  ) / 1_000_000,
)

async function observeCount(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const counter = document.querySelector(
        '[data-reach-card] .reach-summary__total [data-slot="counting-number"]',
      )
      if (!counter) return
      const target = Math.floor(
        Number(
          counter
            .closest('[aria-label]')
            ?.getAttribute('aria-label')
            ?.replace(/[^0-9]/g, ''),
        ) / 1_000_000,
      )
      new MutationObserver(() => {
        const value = Number(counter.textContent?.replaceAll(',', ''))
        if (value > 0 && value < target)
          counter.setAttribute('data-counted', 'true')
      }).observe(counter, {
        childList: true,
        characterData: true,
        subtree: true,
      })
    })
  })
}

test('view counters count up and headings reveal once on entrance', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await observeCount(page)
  await page.goto('/')
  const section = page.locator('[data-reach-card]')
  await section.scrollIntoViewIfNeeded()
  const counter = section.locator(
    '.reach-summary__total [data-slot="counting-number"]',
  )
  await expect(counter).toHaveAttribute('data-counted', 'true')
  await expect(counter).toHaveText(String(total), { timeout: 10000 })
  await expect(section.locator('[data-text-reveal="slide"]')).toHaveClass(
    /text-reveal-visible/,
  )
  await expect(page.locator('#intro-title [data-font-proximity]')).toBeVisible()
  await expect(
    page.locator('#latest-video-title [data-text-reveal]'),
  ).toHaveAttribute('data-text-reveal', 'generate')
})

test('reduced motion shows final view counts without the text animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await observeCount(page)
  await page.goto('/')
  const section = page.locator('[data-reach-card]')
  await section.scrollIntoViewIfNeeded()
  await expect(
    section.locator('.reach-summary__total astro-island[ssr]'),
  ).toHaveCount(0)
  const counter = section.locator(
    '.reach-summary__total [data-slot="counting-number"]',
  )
  await expect(counter).toHaveText(String(total))
  await expect(counter).not.toHaveAttribute('data-counted', 'true')
  await expect(section.locator('.text-reveal-word').first()).toHaveCSS(
    'animation-name',
    'none',
  )
})
