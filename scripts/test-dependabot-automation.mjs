import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const dependabot = parse(read('../.github/dependabot.yml'))
for (const update of dependabot.updates) {
  assert.equal(update['target-branch'], 'main')
}
assert.equal(
  existsSync(
    new URL('../.github/workflows/dependabot-auto-merge.yml', import.meta.url),
  ),
  false,
  'Dependency updates require PR review before production deployment',
)

const ci = parse(read('../.github/workflows/ci.yml'))
const commands = ci.jobs.validate.steps.map((step) => step.run ?? '').join('\n')
const pkg = JSON.parse(read('../package.json'))
for (const name of [
  'check',
  'validate:data',
  'validate:ui',
  ...Object.keys(pkg.scripts).filter((name) => name.startsWith('test:')),
]) {
  assert.ok(commands.includes(`npm run ${name}`), `${name} must run in CI`)
}
assert.ok(commands.includes('npm run smoke:preview -- dist'))
assert.ok(!ci.jobs.validate.steps.some((step) => step.id === 'metadata'))
console.log('Dependency PR targets, manual merge policy, and CI coverage pass.')
