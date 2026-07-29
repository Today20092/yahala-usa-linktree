import { readFile } from 'node:fs/promises'

const [tokens, site, home, reach, latest, map, indexCss] = await Promise.all([
  readFile('tokens.css', 'utf8'),
  readFile('src/data/site.yaml', 'utf8'),
  readFile('src/pages/index.astro', 'utf8'),
  readFile('src/components/ReachBadge.astro', 'utf8'),
  readFile('src/components/LatestChannelVideo.astro', 'utf8'),
  readFile('src/components/VisitedPlacesLeafletMap.tsx', 'utf8'),
  readFile('src/pages/index.css', 'utf8'),
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
  "--font-display: 'Newsreader', ui-serif, serif;",
  'Production display typography must use Newsreader.',
)
requireText(
  tokens,
  "--font-body: 'Plus Jakarta Sans', 'Geist Variable', ui-sans-serif, sans-serif;",
  'Production body typography must use Plus Jakarta Sans.',
)
requireText(
  home,
  "applyTheme(hasThemeControls ? getPreference() : 'light')",
  'The control-free production document must remain in the light theme.',
)
if (
  !/if \(hasThemeControls\)\s+systemQuery\.addEventListener\('change', handleSystemChange\)/.test(
    home,
  )
) {
  throw new Error(
    'System theme changes must not alter the control-free production document.',
  )
}
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
  'text-[var(--color-accent-ink)]',
  'Latest episode must use the light Atlas accent foreground token.',
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
requireText(
  indexCss,
  'color: var(--color-accent-2);',
  'The nearby-stories icon must use the high-contrast accent token.',
)

const semanticRoot = tokens.slice(
  tokens.indexOf(':root {'),
  tokens.indexOf('.dark {'),
)
const atlasRoot = tokens.slice(tokens.lastIndexOf(':root {'))
requireContrast(
  tokenValue(atlasRoot, '--color-accent-ink'),
  tokenValue(semanticRoot, '--primary'),
  4.5,
  'Latest episode',
)
requireContrast(
  tokenValue(atlasRoot, '--color-accent-2'),
  tokenValue(atlasRoot, '--color-paper-2'),
  3,
  'Nearby-stories icon',
)
requireContrast(
  tokenValue(semanticRoot, '--foreground'),
  tokenValue(semanticRoot, '--background'),
  4.5,
  'Map loading state',
)
requireContrast(
  tokenValue(semanticRoot, '--foreground'),
  tokenValue(semanticRoot, '--muted'),
  4.5,
  'Map error state',
)

console.log('Atlas motion, light-theme contrast, and typography seams pass.')
