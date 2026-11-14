import { readFile } from 'node:fs/promises'

const [tokens, site, home, layout, reach, latest, map, indexCss, worker] =
  await Promise.all([
    readFile('tokens.css', 'utf8'),
    readFile('src/data/site.yaml', 'utf8'),
    readFile('src/pages/index.astro', 'utf8'),
    readFile('src/layouts/BrandedPageDocument.astro', 'utf8'),
    readFile('src/components/ReachBadge.astro', 'utf8'),
    readFile('src/components/LatestChannelVideo.astro', 'utf8'),
    readFile('src/components/StoryMapShell.tsx', 'utf8'),
    readFile('src/pages/index.css', 'utf8'),
    readFile('src/worker.js', 'utf8'),
  ])

const requireText = (source, text, message) => {
  if (!source.includes(text)) throw new Error(message)
}

const tokenValue = (source, name) =>
  source.match(new RegExp(`${name}:\\s*(oklch\\([^)]+\\))`))?.[1]

const relativeLuminance = (color) => {
  const [, lightness, chroma, hue] =
    color.match(/oklch\(([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/) ?? []
  const l = Number(lightness) / (color.includes(`${lightness}%`) ? 100 : 1)
  const c = Number(chroma)
  const h = (Number(hue) * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)
  const x = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const y = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const z = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return (
    0.2126 * (4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z) +
    0.7152 * (-1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z) +
    0.0722 * (-0.0041960863 * x - 0.7034186147 * y + 1.707614701 * z)
  )
}

const requireContrast = (foreground, background, minimum, name) => {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const ratio =
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)

  if (ratio + Number.EPSILON < minimum) {
    throw new Error(
      `${name} contrast is ${ratio.toFixed(2)}:1, below ${minimum}:1.`,
    )
  }
}

requireText(
  tokens,
  "--font-display: 'Manrope', ui-sans-serif, sans-serif;",
  'Production display typography must use Manrope.',
)
requireText(
  tokens,
  "--font-body: 'Manrope', ui-sans-serif, sans-serif;",
  'Production body typography must use Manrope.',
)
requireText(
  layout,
  '<script is:inline>',
  'The theme must resolve in a blocking inline head script before first paint.',
)
if (home.includes('data-theme-option') || home.includes('applyTheme')) {
  throw new Error('Theme switching must live only in the shared layout.')
}
requireText(
  indexCss,
  'html body.linktree-page {',
  'Home spacing must override the shared Atlas page padding.',
)
requireText(
  worker,
  "headers.set('Cache-Control', 'no-store')",
  'Nonce-bearing HTML must not be reused with a different CSP nonce.',
)
requireText(
  reach,
  'client:visible',
  'Audience metrics must hydrate when they enter the viewport.',
)
if (reach.includes('startEvent=') || reach.includes('reach-chart:enhance')) {
  throw new Error('Audience metric enhancement must not race hydration events.')
}
requireText(
  latest,
  'text-primary-foreground',
  'Latest episode must pair its primary background with the primary foreground token.',
)
requireText(
  latest,
  'style="background-color: var(--channel-active-accent)"',
  'Latest episode must resolve its channel accent as a background color.',
)
requireText(
  site,
  'accentColor: var(--primary)',
  'Channel actions must use a production semantic color token.',
)
requireText(
  map,
  'bg-background text-foreground',
  'Map loading state must use the background/foreground token pair.',
)
requireText(
  map,
  'bg-muted text-foreground',
  'Map error state must use the muted/foreground token pair.',
)
const themes = {
  light: tokens.slice(tokens.indexOf(':root {'), tokens.indexOf('.dark {')),
  dark: tokens.slice(tokens.indexOf('.dark {'), tokens.indexOf('@theme')),
}
// Primitive pairs behind the semantic tokens; every pair must pass in both themes.
const pairs = [
  ['--color-ink', '--color-paper', 4.5, 'Foreground on background'],
  ['--color-ink', '--color-paper-2', 4.5, 'Foreground on card/muted'],
  ['--color-ink', '--color-paper-3', 4.5, 'Foreground on secondary/accent'],
  ['--color-ink-2', '--color-paper', 4.5, 'Muted text on background'],
  ['--color-ink-2', '--color-paper-2', 4.5, 'Muted text on card/muted'],
  ['--color-ink-2', '--color-paper-3', 4.5, 'Muted text on accent'],
  ['--brand-action', '--color-paper', 4.5, 'Primary text on background'],
  ['--brand-action', '--color-paper-2', 4.5, 'Primary text on card'],
  ['--color-accent-ink', '--brand-action', 4.5, 'Primary foreground'],
  ['--color-focus', '--color-paper', 3, 'Focus ring'],
  ['--color-ink-2', '--color-paper', 3, 'Input boundary'],
  ['--success-foreground', '--success', 4.5, 'Success'],
  ['--warning-foreground', '--warning', 4.5, 'Warning'],
  ['--info-foreground', '--info', 4.5, 'Info'],
]
for (const [theme, block] of Object.entries(themes))
  for (const [foreground, background, minimum, name] of pairs)
    requireContrast(
      tokenValue(block, foreground),
      tokenValue(block, background),
      minimum,
      `${name} (${theme})`,
    )

console.log(
  'Atlas motion, light/dark token contrast, and typography seams pass.',
)
