import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  site: 'https://today20092.github.io',
  base: '/yahala-usa-linktree',
  integrations: [icon(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
