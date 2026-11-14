// Raw-color rules for validate-ui-consistency.mjs. docs/design-system.md quotes these messages.

// Token definition files may hold literal colors; everything else must reference tokens.
export const TOKEN_FILE_PATTERN =
  /^(?:tokens\.css|src\/styles\/(?:tokens|theme)[\w-]*\.css)$/

// Same line or the line above: `ui-color-allow: <reason>`.
export const ALLOW_MARKER = /ui-color-allow:\s*\S/

const PALETTE_HUES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const UTILITY_PREFIXES =
  'bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|divide|placeholder|decoration|accent|caret|shadow'

const ARBITRARY_COLOR = new RegExp(
  String.raw`\b(?:${UTILITY_PREFIXES})-\[(?:#|rgba?\(|hsla?\(|oklch\(|oklab\(|color:)[^\]]*\]`,
  'g',
)
const PALETTE_CLASS = new RegExp(
  String.raw`(?<![\w-])(${UTILITY_PREFIXES})-(white|black|(?:${PALETTE_HUES})-\d{2,3})(?:\/\d+)?(?![\w-])`,
  'g',
)
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g
const HEX_LITERAL =
  /(?<![\w&/-])(?<!href=["'`])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g

const LITERAL_HINT =
  'Use var(--token) from the token file: --foreground/--background for text and page, --muted-foreground for secondary text, --border/--input for edges, --primary for brand actions, --destructive for errors, and color-mix(in oklch, var(--color-shadow) N%, transparent) for shadows or var(--color-scrim) for overlays.'

function utilityHint(prefix, color) {
  const hint = paletteHint(prefix, color)
  return /^(?:fill|stroke)$/.test(prefix)
    ? hint.replaceAll('text-', `${prefix}-`)
    : hint
}

function paletteHint(prefix, color) {
  const kind = prefix.startsWith('bg')
    ? 'bg'
    : /^(?:border|ring|outline|divide)/.test(prefix)
      ? 'border'
      : 'text'
  const hue = color.replace(/-\d+$/, '')

  if (hue === 'white') {
    return {
      bg: 'bg-background or bg-card',
      border: 'border-background',
      text: 'text-primary-foreground on brand fills, otherwise text-background',
    }[kind]
  }
  if (hue === 'black') {
    return {
      bg: 'bg-(--color-scrim)/40 for overlays, otherwise bg-foreground',
      border: 'border-foreground',
      text: 'text-foreground',
    }[kind]
  }
  if (/^(?:slate|gray|zinc|neutral|stone)$/.test(hue)) {
    return {
      bg: 'bg-muted',
      border: 'border-border, or border-input for control edges',
      text: 'text-muted-foreground',
    }[kind]
  }
  if (/^(?:red|rose)$/.test(hue)) {
    return `${kind}-destructive for errors, otherwise ${kind}-primary`
  }
  return `${kind}-primary or another semantic token in docs/design-system.md`
}

function lineAllowed(lines, index) {
  return (
    ALLOW_MARKER.test(lines[index]) || ALLOW_MARKER.test(lines[index - 1] ?? '')
  )
}

function isCommentLine(line) {
  return /^\s*(?:\/\/|\/?\*|<!--)/.test(line)
}

/**
 * Returns `{ line, message }` for each raw color in `text`.
 * `relative` uses forward slashes from the repository root.
 */
export function findRawColors(text, relative) {
  if (TOKEN_FILE_PATTERN.test(relative)) return []

  const lines = text.split(/\r?\n/)
  const findings = []

  lines.forEach((line, index) => {
    if (isCommentLine(line) || lineAllowed(lines, index)) return
    const seen = []
    const add = (match, message) => {
      const end = match.index + match[0].length
      if (seen.some(([start, stop]) => match.index < stop && end > start))
        return
      seen.push([match.index, end])
      findings.push({ line: index + 1, message })
    }

    for (const match of line.matchAll(ARBITRARY_COLOR)) {
      add(match, `arbitrary color value "${match[0]}". ${LITERAL_HINT}`)
    }
    for (const match of line.matchAll(PALETTE_CLASS)) {
      add(
        match,
        `Tailwind palette class "${match[0]}". Use ${utilityHint(match[1], match[2])}.`,
      )
    }
    for (const match of line.matchAll(COLOR_FUNCTION)) {
      add(match, `raw color function "${match[0]}…)". ${LITERAL_HINT}`)
    }
    for (const match of line.matchAll(HEX_LITERAL)) {
      add(match, `raw hex color "${match[0]}". ${LITERAL_HINT}`)
    }
  })

  return findings
}
