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
    source.includes("import '../design-preview.css'")
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
  "import '../design-preview.css'",
  '<!doctype html>',
  'data-design-preview',
  'data-design="atlas"',
  'name="viewport"',
  '<slot name="head" />',
  '<slot />',
]) {
  if (!layout.includes(invariant)) {
    throw new Error(`BrandedPageDocument is missing ${invariant}`)
  }
}

console.log('Branded page document seam is consistent.')
