import { readFile } from 'node:fs/promises'
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
