import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const logoPath = join(publicDir, 'yahala-channel-logo.png')

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

async function generateFavicons() {
  console.log('Generating favicon PNGs from yahala-channel-logo.png...')

  for (const { name, size } of sizes) {
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name))
    console.log(`  Created ${name}`)
  }

  const icoBuffer = await pngToIco(logoPath)
  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer)
  console.log('  Created favicon.ico')

  console.log('\nGenerating web manifest...')
  const manifest = {
    name: 'Ya Hala with Haithum',
    short_name: 'Ya Hala',
    icons: [
      {
        src: '/yahala-usa-linktree/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/yahala-usa-linktree/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#18181b',
    background_color: '#18181b',
    display: 'standalone',
  }

  writeFileSync(
    join(publicDir, 'site.webmanifest'),
    `${JSON.stringify(manifest, null, 2)}\n`
  )
  console.log('  Created site.webmanifest')

  console.log('\nDone! All favicons generated.')
}

generateFavicons().catch(console.error)
