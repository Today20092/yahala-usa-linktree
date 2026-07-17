import { readFile } from 'node:fs/promises'

const html = await readFile('dist/index.html', 'utf8')
const expectedText = [
  'Updated Jun 22, 2026',
  '155,359,353',
  '22,201,272',
  '28,166,560',
  '25,568,075',
  '79,423,446',
]

if (!html.includes('data-reach-chart'))
  throw new Error('Production HTML is missing the audience chart')

for (const value of expectedText) {
  if (!html.includes(value))
    throw new Error(`Production HTML is missing audience value ${value}`)
}

if ((html.match(/reach-summary__bar/g) ?? []).length !== 4)
  throw new Error('Production HTML must contain four audience bars')

console.log('Audience chart is server-rendered with all verified values.')
