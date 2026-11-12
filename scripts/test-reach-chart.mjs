import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import YAML from 'yaml'

const html = await readFile('dist/index.html', 'utf8')
const { socialReach } = YAML.parse(await readFile('src/data/site.yaml', 'utf8'))
const formatNumber = new Intl.NumberFormat('en-US').format
const updatedDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(socialReach.updatedAt))
const expectedText = [
  `Updated ${updatedDate}`,
  formatNumber(
    socialReach.items.reduce((total, item) => total + item.value, 0),
  ),
  ...socialReach.items.map((item) => formatNumber(item.value)),
]
const expectedPlatformCount = new Set(
  socialReach.items.map((item) => item.platform),
).size

if (!html.includes('data-reach-chart'))
  throw new Error('Production HTML is missing the audience chart')
for (const value of expectedText) {
  if (!html.includes(value))
    throw new Error(`Production HTML is missing audience value ${value}`)
}

if ((html.match(/reach-summary__bar/g) ?? []).length !== expectedPlatformCount)
  throw new Error(
    `Production HTML must contain ${expectedPlatformCount} audience bars`,
  )

console.log('Audience chart is server-rendered with all verified values.')

const platformRows = [
  ...html.matchAll(
    /<dt\b[^>]*>[\s\S]*?<span[^>]*>(YouTube|TikTok|Instagram|Facebook)<\/span>/g,
  ),
].map((match) => match[1])
const totals = new Map()
for (const item of socialReach.items) {
  totals.set(item.platform, (totals.get(item.platform) ?? 0) + item.value)
}
assert.deepEqual(
  platformRows,
  [...totals].sort((a, b) => b[1] - a[1]).map(([name]) => name),
)
assert.ok(html.includes('Recorded views, not unique viewers.'))
const reach = html.match(/<aside\b[^>]*data-reach-card[\s\S]*?<\/aside>/)?.[0]
assert.ok(reach, 'Home must render the view summary')
const visibleReach = reach.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
const total = socialReach.items.reduce((sum, item) => sum + item.value, 0)
assert.ok(
  visibleReach.includes(formatNumber(Math.floor(total / 1_000_000)) + 'M+'),
)
for (const item of socialReach.items) {
  assert.ok(
    visibleReach.includes(
      formatNumber(Math.floor(item.value / 1_000_000)) + 'M+',
    ),
  )
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(item.updatedAt ?? socialReach.updatedAt))
  assert.ok(reach.includes('Updated ' + date))
}

const snapshot = JSON.parse(
  await readFile('src/data/story-view-snapshot.json', 'utf8'),
)
const catalog = JSON.parse(
  await readFile('src/data/youtube-videos.json', 'utf8'),
)
const about = await readFile('dist/about/index.html', 'utf8')
const chart = about.match(
  /<section\b[^>]*data-most-watched-stories[\s\S]*?<\/section>/,
)?.[0]
assert.ok(chart, 'About must render the ranking without JavaScript')
assert.equal(snapshot.entries.length, 5)
assert.equal(new Set(snapshot.entries.map((row) => row.videoId)).size, 5)
assert.ok(
  snapshot.recordedCount <= snapshot.eligibleCount &&
    snapshot.recordedCount >= 5,
)
assert.ok(Number.isFinite(Date.parse(snapshot.capturedAt)))
assert.equal(snapshot.approximate, true)
assert.ok(chart.includes('Approximate public YouTube views'))
assert.ok(chart.includes('Views are not unique viewers.'))
let previousViews = Infinity
let previousPosition = -1
for (const { videoId, views } of snapshot.entries) {
  assert.ok(Number.isSafeInteger(views) && views >= 0 && views <= previousViews)
  previousViews = views
  assert.equal(catalog[videoId]?.isShort, false)
  assert.ok(
    !(
      catalog[videoId].width &&
      catalog[videoId].height &&
      catalog[videoId].width <= catalog[videoId].height
    ),
  )
  const position = chart.indexOf(`https://www.youtube.com/watch?v=${videoId}`)
  assert.ok(position > previousPosition, 'Story links must follow view ranking')
  previousPosition = position
  assert.ok(chart.includes(formatNumber(views)))
}
assert.ok(
  !chart.includes(' stories</span>'),
  'View counts must not be labeled as stories',
)
assert.ok(
  chart.includes('dir="auto"'),
  'Story titles must preserve bidirectional text',
)
console.log(
  'Reach ranking, snapshot integrity, server-rendered story links, units and disclosures pass.',
)
