// Local Lighthouse run with the same noise protection as CI: N runs per page, report the median.
// Usage: npm run perf:lighthouse [-- --runs=5]   (or LH_RUNS=5)   |   node scripts/perf-lighthouse.mjs --self-test
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

if (process.argv.includes('--self-test')) {
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([4, 1, 3, 2]), 2.5)
  assert.equal(median([7]), 7)
  console.log('median self-test passed')
  process.exit(0)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const flag = process.argv.find((a) => a.startsWith('--runs='))
const runs = Number(flag?.split('=')[1] ?? process.env.LH_RUNS ?? 5)
if (!Number.isInteger(runs) || runs < 1) {
  console.error('Runs must be a positive integer (--runs=N or LH_RUNS=N).')
  process.exit(1)
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const win = process.platform === 'win32'
  const cache = win
    ? path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
    : process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library/Caches/ms-playwright')
      : path.join(os.homedir(), '.cache/ms-playwright')
  const exe = win
    ? 'chrome-win64/chrome.exe'
    : process.platform === 'darwin'
      ? 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
      : 'chrome-linux64/chrome'
  const dirs = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d))
    : []
  // Newest Playwright revision first.
  dirs.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
  return dirs.map((d) => path.join(cache, d, exe)).find((p) => fs.existsSync(p))
}

const chrome = findChrome()
if (!chrome) {
  console.error(
    'Chrome not found. Set CHROME_PATH, or run `npx playwright install chromium`.',
  )
  process.exit(1)
}

const quote = (s) => `"${s}"`
const run = (cmd, args, cwd, env) => {
  const r = spawnSync(`${cmd} ${args.map(quote).join(' ')}`, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true,
  })
  if (r.status !== 0)
    throw new Error(`${cmd} ${args[0]} failed (exit ${r.status})`)
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yahala-lh-'))
const site = path.join(tmp, 'site')
const work = path.join(tmp, 'work') // lhci writes .lighthouseci here, not in the repo
fs.mkdirSync(work)

try {
  const rc = JSON.parse(
    fs.readFileSync(path.join(root, 'lighthouserc.json'), 'utf8'),
  )
  const urls = rc.ci.collect.url

  run('npx', ['astro', 'build', '--outDir', site], root)
  // shortcut: headless Chrome on Windows sometimes drops its session mid-run ("Session closed"); retry the whole collect up to 3 times, then fail.
  for (let attempt = 1; ; attempt++) {
    try {
      run(
        'npx',
        [
          '--yes',
          '@lhci/cli@0.16.0',
          'collect',
          `--config=${path.join(root, 'lighthouserc.json')}`,
          `--staticDistDir=${site}`,
          `--numberOfRuns=${runs}`,
        ],
        work,
        { CHROME_PATH: chrome },
      )
      break
    } catch (error) {
      if (attempt === 3) throw error
      console.error(
        `Lighthouse collect failed (attempt ${attempt}/3); retrying.`,
      )
    }
  }

  const dir = path.join(work, '.lighthouseci')
  const byPage = {}
  for (const f of fs.readdirSync(dir).filter((f) => /^lhr-.*\.json$/.test(f))) {
    const lhr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const a = lhr.audits
    const page = new URL(lhr.finalUrl ?? lhr.requestedUrl).pathname
    ;(byPage[page] ??= []).push({
      perf: lhr.categories.performance.score,
      lcp: a['largest-contentful-paint'].numericValue,
      tbt: a['total-blocking-time'].numericValue,
      cls: a['cumulative-layout-shift'].numericValue,
      kb: a['total-byte-weight'].numericValue / 1024,
    })
  }

  const fmt = {
    perf: (v) => v.toFixed(2),
    lcp: (v) => `${Math.round(v)}ms`,
    tbt: (v) => `${Math.round(v)}ms`,
    cls: (v) => v.toFixed(3),
    kb: (v) => `${Math.round(v)}KB`,
  }
  const rows = [
    ['page', 'runs', ...Object.keys(fmt).map((k) => `${k} med (min-max)`)],
  ]
  for (const page of Object.keys(byPage).sort()) {
    const rs = byPage[page]
    rows.push([
      page,
      String(rs.length),
      ...Object.keys(fmt).map((k) => {
        const v = rs.map((r) => r[k])
        return `${fmt[k](median(v))} (${fmt[k](Math.min(...v))}-${fmt[k](Math.max(...v))})`
      }),
    ])
  }
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => r[i].length)),
  )
  console.log(`\nLighthouse, ${runs} runs per page (median, min-max):`)
  for (const r of rows)
    console.log(r.map((c, i) => c.padEnd(widths[i])).join('  '))
  if (Object.keys(byPage).length !== urls.length) {
    throw new Error(
      `Expected ${urls.length} pages, got ${Object.keys(byPage).length}.`,
    )
  }
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
