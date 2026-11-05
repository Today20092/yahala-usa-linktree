// Renders the per-page 1200x630 share images into public/og/. Output is committed;
// run `npm run generate:og` after changing page copy or site.yaml.
import { mkdir, readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { parse } from 'yaml'

const { site, about, visitedPlaces } = parse(
  await readFile('src/data/site.yaml', 'utf8'),
)

// Atlas tokens from tokens.css (--color-paper, --color-ink, --brand-action), as sRGB.
const paper = '#f8f8fc'
const ink = '#2b265d'
const accent = '#d12b43'
// Georgia/Segoe UI: installed system fonts librsvg can load; Geist/Newsreader are woff2 only.
const serif = "Georgia, 'Times New Roman', serif"
const sans = "'Segoe UI', Arial, sans-serif"

// shortcut: stories/contact copy mirrors their SEO text in the .astro pages, update both.
const cards = {
  index: {
    eyebrow: 'Arab American stories',
    title: site.siteName,
    subtitle: site.pageDescription,
  },
  about: {
    eyebrow: 'Meet the host',
    title: about.name,
    subtitle: about.role,
  },
  stories: {
    eyebrow: 'Ya Hala stories',
    title: 'Story Browser',
    subtitle: visitedPlaces.description,
  },
  contact: {
    eyebrow: 'Partnerships',
    title: 'Contact & partnerships',
    subtitle:
      'Sponsor a Ya Hala video, introduce your local business, or share an Arab-American story.',
  },
}

const escapeXml = (text) =>
  text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)

const wrap = (text, maxChars) =>
  text.split(' ').reduce((lines, word) => {
    const last = lines.at(-1)
    if (last !== undefined && `${last} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = `${last} ${word}`
    } else {
      lines.push(word)
    }
    return lines
  }, [])

const lines = (text, maxChars, x, y, step, attrs) =>
  wrap(text, maxChars)
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * step}" ${attrs}>${escapeXml(line)}</text>`,
    )
    .join('')

const svg = ({ eyebrow, title, subtitle }) => {
  const titleLines = wrap(title, 16).length
  const subtitleY = 250 + (titleLines - 1) * 78 + 62
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="${paper}"/>
<circle cx="1080" cy="560" r="300" fill="${accent}" opacity="0.1"/>
<rect x="72" y="92" width="64" height="8" fill="${accent}"/>
<text x="72" y="150" font-family="${sans}" font-size="28" font-weight="700" letter-spacing="4" fill="${accent}">${escapeXml(eyebrow.toUpperCase())}</text>
${lines(title, 16, 72, 250, 78, `font-family="${serif}" font-size="68" font-weight="700" fill="${ink}"`)}
${lines(subtitle, 40, 72, subtitleY, 42, `font-family="${sans}" font-size="30" fill="${ink}" fill-opacity="0.8"`)}
<rect y="550" width="1200" height="80" fill="${ink}"/>
<text x="72" y="600" font-family="${sans}" font-size="28" font-weight="600" fill="${paper}">Ya Hala with Haithum</text>
<text x="1128" y="600" text-anchor="end" font-family="${sans}" font-size="32" font-weight="600" fill="${paper}">ياهلا مع هيثم</text>
</svg>`
}

const logo = await sharp('public/yahala-channel-logo.png')
  .resize(400, 400)
  .toBuffer()

await mkdir('public/og', { recursive: true })
for (const [page, card] of Object.entries(cards)) {
  await sharp(Buffer.from(svg(card)))
    .composite([{ input: logo, left: 740, top: 70 }])
    .png({ compressionLevel: 9 })
    .toFile(`public/og/${page}.png`)
  console.log(`public/og/${page}.png`)
}
