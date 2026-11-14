// WCAG 2.2 AA contrast for semantic token pairs in light and dark themes.
// Resolves tokens from the token CSS files, so new `--x` / `--x-foreground` pairs are checked automatically.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const rootDir = path.resolve(process.env.UI_VALIDATE_ROOT ?? process.cwd())
const TEXT = 4.5 // 1.4.3 normal text
const UI = 3 // 1.4.11 component boundaries and focus indicators

// Extra pairs beyond the automatic `--x-foreground` on `--x` set: [foreground, background, minimum, use].
const PAIRS = [
  ['foreground', 'background', TEXT, 'body text on page'],
  ['muted-foreground', 'background', TEXT, 'secondary text on page'],
  ['muted-foreground', 'card', TEXT, 'secondary text on card'],
  ['primary', 'background', TEXT, 'brand links and text-primary'],
  ['destructive', 'background', TEXT, 'error text on page'],
  ['destructive', 'card', TEXT, 'error text on card'],
  ['ring', 'background', UI, 'focus ring on page'],
  ['ring', 'card', UI, 'focus ring on card'],
  ['input', 'background', UI, 'form control boundary on page'],
  ['input', 'card', UI, 'form control boundary on card'],
]
// Decorative edges are exempt from 1.4.11; report them without failing.
const ADVISORY = [['border', 'background', UI, 'decorative divider/card edge']]

function tokenFiles() {
  const stylesDir = path.join(rootDir, 'src', 'styles')
  const files = [path.join(rootDir, 'tokens.css')]
  if (existsSync(stylesDir)) {
    for (const name of readdirSync(stylesDir).sort()) {
      if (/^(?:tokens|theme)[\w-]*\.css$/.test(name)) {
        files.push(path.join(stylesDir, name))
      }
    }
  }
  return files.filter((file) => existsSync(file))
}

// Top-level rules only; nested at-rule blocks such as @theme are ignored.
function topLevelRules(css) {
  const rules = []
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let depth = 0
  let start = 0
  let selector = ''
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') {
      if (depth === 0) {
        selector = text.slice(start, i).trim()
        start = i + 1
      }
      depth += 1
    } else if (text[i] === '}') {
      depth -= 1
      if (depth === 0) {
        rules.push({ selector, body: text.slice(start, i) })
        start = i + 1
      }
    }
  }
  return rules
}

function declarations(body) {
  const result = {}
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    result[match[1]] = match[2].replace(/\s+/g, ' ').trim()
  }
  return result
}

export function themeTokens(css) {
  const light = {}
  const dark = {}
  for (const { selector, body } of topLevelRules(css)) {
    if (selector.startsWith('@')) continue
    const selectors = selector.split(',').map((part) => part.trim())
    const isDark = selectors.some((part) =>
      /\.dark\b|data-theme=['"]?dark/.test(part),
    )
    const isRoot = selectors.some((part) => /^(?::root|html)$/.test(part))
    if (isDark) Object.assign(dark, declarations(body))
    else if (isRoot) Object.assign(light, declarations(body))
  }
  return { light, dark: { ...light, ...dark } }
}

function resolve(tokens, value, seen = new Set()) {
  const ref = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/)
  if (!ref) return value
  if (seen.has(ref[1])) return null
  seen.add(ref[1])
  const next = tokens[ref[1]] ?? ref[2]
  return next == null ? null : resolve(tokens, next, seen)
}

const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const toGamma = (c) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
const clamp = (c) => Math.min(1, Math.max(0, c))
const amount = (text, scale = 1) =>
  text.endsWith('%') ? Number.parseFloat(text) / 100 : Number(text) / scale

// Returns gamma-encoded sRGB `[r, g, b, alpha]`, or null for unsupported syntax.
export function parseColor(value) {
  if (value === 'white') return [1, 1, 1, 1]
  if (value === 'black') return [0, 0, 0, 1]
  const hex = value.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    return [0, 2, 4]
      .map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255)
      .concat(1)
  }
  const oklch = value.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/,
  )
  if (!oklch) return null
  const L = amount(oklch[1])
  const C = Number(oklch[2])
  const h = (Number(oklch[3]) * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  // shortcut: clips out-of-gamut channels instead of CSS gamut mapping; fine for AA margins.
  return linear
    .map((c) => clamp(toGamma(clamp(c))))
    .concat(oklch[4] ? amount(oklch[4]) : 1)
}

const luminance = ([r, g, b]) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

export function contrast(foreground, background) {
  const over = (top, under) =>
    top.slice(0, 3).map((c, i) => c * top[3] + under[i] * (1 - top[3]))
  const bg = background[3] < 1 ? over(background, [1, 1, 1]) : background
  const fg = over(foreground, bg)
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Self-check against known WCAG values.
assert.equal(contrast([0, 0, 0, 1], [1, 1, 1, 1]).toFixed(1), '21.0')
assert.equal(
  contrast(parseColor('#767676'), parseColor('white')).toFixed(2),
  '4.54',
)
assert.deepEqual(
  parseColor('oklch(1 0 0)').map((c) => c.toFixed(3)),
  ['1.000', '1.000', '1.000', '1.000'],
)

const css = tokenFiles()
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const themes = themeTokens(css)
const failures = []
let checked = 0

for (const [theme, tokens] of Object.entries(themes)) {
  const auto = Object.keys(tokens)
    .filter(
      (name) => name.endsWith('-foreground') && tokens[name.slice(0, -11)],
    )
    .map((name) => [
      name.slice(2),
      name.slice(2, -11),
      TEXT,
      'paired foreground',
    ])
  const rows = [
    ...auto,
    ...PAIRS.filter(([fg, bg]) => tokens[`--${fg}`] && tokens[`--${bg}`]),
  ]

  for (const [fgName, bgName, minimum, use, advisory] of [
    ...rows,
    ...ADVISORY.map((pair) => [...pair, true]),
  ]) {
    const fgValue = resolve(tokens, `var(--${fgName})`)
    const bgValue = resolve(tokens, `var(--${bgName})`)
    const fg = fgValue && parseColor(fgValue)
    const bg = bgValue && parseColor(bgValue)
    if (!fg || !bg) {
      failures.push(
        `${theme}: --${fgName} on --${bgName} has an unsupported value (${fgValue} / ${bgValue}); extend parseColor.`,
      )
      continue
    }
    const ratio = contrast(fg, bg)
    const pass = ratio >= minimum
    checked += 1
    const line = `${pass ? 'pass' : advisory ? 'note' : 'FAIL'}  ${theme.padEnd(5)}  --${fgName} on --${bgName}: ${ratio.toFixed(2)}:1 (needs ${minimum}:1, ${use})`
    console.log(line)
    if (!pass && !advisory) failures.push(line)
  }
}

if (failures.length > 0) {
  console.error(`\nToken contrast failed (${failures.length}):`)
  for (const failure of failures) console.error(`- ${failure}`)
  console.error(
    'Fix the token values in the token file; see docs/design-system.md.',
  )
  process.exit(1)
}
console.log(`\nToken contrast passed: ${checked} pairs across light and dark.`)
