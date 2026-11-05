import { extname } from 'node:path'

// Serve Astro's directory-index output without Vite's single-page fallback.
export default {
  appType: 'mpa',
  plugins: [
    {
      name: 'astro-directory-index',
      configurePreviewServer(server) {
        server.middlewares.use((request, _response, next) => {
          const url = new URL(request.url, 'http://localhost')
          if (!url.pathname.endsWith('/') && !extname(url.pathname)) {
            request.url = `${url.pathname}/${url.search}`
          }
          next()
        })
      },
    },
  ],
}
