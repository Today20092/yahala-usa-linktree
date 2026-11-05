import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { build } from 'esbuild'

// Bundle only project TSX; keep React shared with the server renderer.
const compiled = await build({
  stdin: {
    contents: `
      import * as React from 'react'
      import { renderToStaticMarkup } from 'react-dom/server'
      import { Button } from './src/components/ui/button'
      import { Badge } from './src/components/ui/badge'
      import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './src/components/ui/accordion'
      import SocialLinkButton from './src/components/SocialLinkButton'

      export const native = renderToStaticMarkup(<Button disabled variant="outline" size="lg">Retry</Button>)
      export const submit = renderToStaticMarkup(<Button type="submit">Search</Button>)
      export const link = renderToStaticMarkup(
        <Button nativeButton={false} render={<a href="/stories" role="link" className="consumer-link" />}>
          Browse stories
        </Button>
      )
      export const social = renderToStaticMarkup(
        <SocialLinkButton href="https://example.com/channel" label="Channel" ariaLabel="Ya Hala channel" />
      )
      export const badge = renderToStaticMarkup(<Badge variant="secondary">New</Badge>)
      export const badgeLink = renderToStaticMarkup(
        <Badge render={<a href="/stories" className="consumer-badge" />} variant="outline">Stories</Badge>
      )
      const items = <>
        <AccordionItem value="one">
          <AccordionTrigger>First story</AccordionTrigger>
          <AccordionContent>First details</AccordionContent>
        </AccordionItem>
        <AccordionItem value="two" disabled>
          <AccordionTrigger>Second story</AccordionTrigger>
          <AccordionContent>Second details</AccordionContent>
        </AccordionItem>
      </>
      export const single = renderToStaticMarkup(<Accordion value={['one']} keepMounted>{items}</Accordion>)
      export const multiple = renderToStaticMarkup(<Accordion multiple value={['one', 'two']}>{items}</Accordion>)
      export const collapsed = renderToStaticMarkup(<Accordion value={[]} keepMounted>{items}</Accordion>)
    `,
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  alias: { '@': path.resolve('src') },
  write: false,
})
const module = { exports: {} }
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
  createRequire(import.meta.url),
  module,
  module.exports,
)
const rendered = module.exports

assert.match(rendered.native, /^<button\b/)
assert.match(rendered.native, /type="button"/)
assert.match(rendered.native, /disabled=""/)
assert.match(rendered.native, /data-variant="outline"/)
assert.match(rendered.native, /data-size="lg"/)
assert.match(rendered.submit, /type="submit"/)
for (const html of [rendered.link, rendered.social]) {
  assert.match(html, /^<a\b/)
  assert.ok(
    !html.includes('<button'),
    'Navigation must not introduce nested buttons',
  )
  assert.ok(
    !html.includes('role="button"'),
    'Navigation must retain link semantics',
  )
  assert.match(html, /data-slot="button"/)
}
assert.match(rendered.link, /href="\/stories"/)
assert.match(rendered.link, /consumer-link/)
assert.match(rendered.social, /target="_blank"/)
assert.match(
  rendered.social,
  /aria-label="Ya Hala channel \(opens in a new tab\)"/,
)
assert.match(rendered.badge, /^<span\b/)
assert.match(rendered.badgeLink, /^<a\b/)
assert.match(rendered.badgeLink, /href="\/stories"/)
assert.match(rendered.badgeLink, /consumer-badge/)
assert.match(rendered.badgeLink, /data-variant="outline"/)

const triggers = (html) =>
  [...html.matchAll(/<button\b[^>]*>/g)].map(([tag]) => tag)
const singleTriggers = triggers(rendered.single)
assert.equal(singleTriggers.length, 2)
assert.match(singleTriggers[0], /aria-expanded="true"/)
assert.match(singleTriggers[1], /aria-expanded="false"/)
assert.match(singleTriggers[1], /disabled=""/)
const triggerId = singleTriggers[0].match(/\bid="([^"]+)"/)?.[1]
const panelId = singleTriggers[0].match(/aria-controls="([^"]+)"/)?.[1]
assert.ok(
  triggerId && panelId,
  'Expanded trigger must identify its associated panel',
)
assert.ok(rendered.single.includes(`id="${panelId}"`))
assert.ok(rendered.single.includes(`aria-labelledby="${triggerId}"`))
assert.equal(
  triggers(rendered.multiple).filter((tag) =>
    tag.includes('aria-expanded="true"'),
  ).length,
  2,
)
assert.equal(
  triggers(rendered.collapsed).filter((tag) =>
    tag.includes('aria-expanded="true"'),
  ).length,
  0,
)
assert.ok(
  rendered.collapsed.includes('First details'),
  'keepMounted must retain collapsed panel content',
)

const sourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const filename = path.join(directory, entry.name)
      return entry.isDirectory()
        ? sourceFiles(filename)
        : /\.(?:tsx?|astro|css|[cm]?js)$/.test(entry.name)
          ? [filename]
          : []
    }),
  )
  return nested.flat()
}
for (const filename of await sourceFiles('src')) {
  const source = await readFile(filename, 'utf8')
  assert.ok(
    !/(?:from\s*['"](?:@radix-ui\/|radix-ui)|--radix-|\basChild\b)/.test(
      source,
    ),
    `Unmigrated Radix API in ${filename}`,
  )
}
console.log(
  'Base UI render regression checks passed: button/link semantics, badge composition, accordion controlled/disabled/panel state, and source sweep.',
)
