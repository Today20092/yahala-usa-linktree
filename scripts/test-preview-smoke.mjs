import { mkdtemp, mkdir, rm, unlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const script = path.resolve('scripts/smoke-preview.mjs')
const html = `<!doctype html><link rel="stylesheet" href="./_astro/site.css"><script type="module" src="/_astro/site.js"></script><aside data-reach-card></aside><button id="qr-open">QR</button><div aria-label="Map"></div><p>Choose a state to watch stories</p><a>Latest From Ya Hala</a>`

const run = (target) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [script, target])
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('close', (status) => resolve({ status, output }))
  })

const directory = await mkdtemp(path.join(tmpdir(), 'preview-smoke-'))
await mkdir(path.join(directory, '_astro'))
await writeFile(path.join(directory, 'index.html'), html)
await writeFile(path.join(directory, '_astro/site.css'), '')
await writeFile(path.join(directory, '_astro/site.js'), '')

try {
  const localPass = await run(directory)
  if (localPass.status !== 0) throw new Error(localPass.output)

  await unlink(path.join(directory, '_astro/site.js'))
  const localFailure = await run(directory)
  if (
    localFailure.status === 0 ||
    !localFailure.output.includes('Preview smoke failed')
  ) {
    throw new Error('Missing local assets must fail the smoke check')
  }

  let wrongContentType = false
  const server = createServer((request, response) => {
    if (request.url === '/') {
      response.writeHead(200, {
        'content-type': 'text/html',
        'content-security-policy': "default-src 'self'",
      })
      return response.end(html)
    }

    const isCss = request.url.endsWith('.css')
    response.writeHead(200, {
      'content-type': wrongContentType
        ? 'text/html'
        : isCss
          ? 'text/css'
          : 'application/javascript',
    })
    response.end('')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  try {
    const url = `http://127.0.0.1:${server.address().port}`
    const remotePass = await run(url)
    if (remotePass.status !== 0) throw new Error(remotePass.output)

    wrongContentType = true
    const remoteFailure = await run(url)
    if (
      remoteFailure.status === 0 ||
      !remoteFailure.output.includes('wrong content type')
    ) {
      throw new Error('Wrong deployed content types must fail the smoke check')
    }
  } finally {
    server.close()
  }
} finally {
  await rm(directory, { recursive: true, force: true })
}

console.log('Preview smoke checks are valid.')
