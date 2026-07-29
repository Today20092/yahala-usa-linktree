import { readFile } from 'node:fs/promises'

const pages = ['index', 'about', 'stories']

for (const page of pages) {
  const source = await readFile(`src/pages/${page}.astro`, 'utf8')

  if (
    !source.includes(
      "import BrandedPageDocument from '../layouts/BrandedPageDocument.astro'",
    )
  ) {
    throw new Error(`${page}.astro must use BrandedPageDocument`)
  }

  if (
    source.includes("import '../styles.css'") ||
    source.includes("import '../atlas.css'")
  ) {
    throw new Error(`${page}.astro must not own production style imports`)
  }

  if (
    !source.includes('<BrandedPageDocument') ||
    source.includes('<!doctype html>')
  ) {
    throw new Error(`${page}.astro must render through BrandedPageDocument`)
  }
}

const layout = await readFile('src/layouts/BrandedPageDocument.astro', 'utf8')

for (const invariant of [
  "import '../styles.css'",
  "import '../atlas.css'",
  '<!doctype html>',
  'name="viewport"',
  '<slot name="head" />',
  '<slot />',
]) {
  if (!layout.includes(invariant)) {
    throw new Error(`BrandedPageDocument is missing ${invariant}`)
  }
}

for (const previewArtifact of [
  'design-preview.css',
  'data-design-preview',
  'data-design=',
  'requestedDesign',
]) {
  if (layout.includes(previewArtifact)) {
    throw new Error(
      `BrandedPageDocument must not depend on preview artifact ${previewArtifact}`,
    )
  }
}

const atlas = await readFile('src/atlas.css', 'utf8')

for (const alternateDesign of ['data-design', 'field', 'night']) {
  if (atlas.includes(alternateDesign)) {
    throw new Error(`Atlas styling must not depend on ${alternateDesign}`)
  }
}

console.log('Branded page document seam is consistent.')
