import { mkdtemp, mkdir, rm, unlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const script = path.resolve('scripts/smoke-preview.mjs')
const html = `<!doctype html><link rel="stylesheet" href="./_astro/site.css"><script type="module" src="/_astro/site.js"></script><a>Watch latest</a><nav aria-label="Official social links"></nav><a href="#qr-dialog" data-qr-open>QR</a><div id="qr-dialog" role="dialog"><a href="/" data-qr-destination>Destination</a></div><aside data-reach-card></aside><a>Latest From Ya Hala</a><section data-portfolio-scroll="manual">Moments from Ya Hala stories</section><div aria-label="Map"></div><p>Choose a state to watch stories</p><footer></footer>`

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

  await writeFile(
    path.join(directory, 'index.html'),
    html.replace(
      '<aside data-reach-card></aside><a>Latest From Ya Hala</a>',
      '<a>Latest From Ya Hala</a><aside data-reach-card></aside>',
    ),
  )
  const orderFailure = await run(directory)
  if (
    orderFailure.status === 0 ||
    !orderFailure.output.includes('Page flow out of order')
  ) {
    throw new Error('Out-of-order page flow must fail the smoke check')
  }

  await writeFile(
    path.join(directory, 'index.html'),
    html.replace('<footer>', '<div class="bento-scroll-track"></div><footer>'),
  )
  const motionFailure = await run(directory)
  if (
    motionFailure.status === 0 ||
    !motionFailure.output.includes('continuous portfolio motion')
  ) {
    throw new Error('Continuous portfolio motion must fail the smoke check')
  }

  await writeFile(path.join(directory, 'index.html'), html)
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
