import { preview } from 'vite'

export default async function setup() {
  const server = await preview({
    configFile: 'vite.a11y.config.mjs',
    preview: { host: '127.0.0.1', port: 4337, strictPort: true },
  })
  return async () => {
    server.httpServer.closeAllConnections()
    await new Promise((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()))
    })
  }
}
