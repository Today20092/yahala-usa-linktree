import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { parse } from 'yaml'

const readYaml = (path) =>
  parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const workflow = (name) => readYaml(`../.github/workflows/${name}.yml`)
const ci = workflow('ci')
assert.deepEqual(ci.on.push.branches, ['development', 'main'])
assert.deepEqual(ci.on.pull_request.branches, ['development', 'main'])

const deploy = workflow('deploy')
assert.deepEqual(deploy.on.push.branches, ['main'])
assert.equal(deploy.jobs.deploy.if, "github.ref == 'refs/heads/main'")

const refresh = workflow('refresh-youtube-data')
const refreshJob = refresh.jobs['refresh-youtube-data']
assert.equal(refreshJob.if, "github.ref == 'refs/heads/main'")
assert.equal(refresh.permissions.deployments, undefined)
const checkout = refreshJob.steps.find((step) =>
  step.uses?.startsWith('actions/checkout@'),
)
assert.equal(checkout.with.ref, 'development')
assert.equal(checkout.with['fetch-depth'], 0)
const commitIndex = refreshJob.steps.findIndex((step) =>
  step.uses?.startsWith('stefanzweifel/git-auto-commit-action@'),
)
assert.ok(
  commitIndex >= 0,
  'Catalog refresh must have an explicit commit destination',
)
assert.equal(refreshJob.steps[commitIndex].with.branch, 'development')
const precedingCommands = refreshJob.steps
  .slice(0, commitIndex)
  .map((step) => step.run ?? '')
  .join('\n')
assert.match(
  precedingCommands,
  /git pull --rebase --autostash origin development/,
)
for (const check of [
  'validate:data',
  'validate:ui',
  'test:locations',
  'build',
  'smoke:preview',
]) {
  assert.ok(
    precedingCommands.includes(`npm run ${check}`),
    `${check} must pass before catalog changes are committed`,
  )
}

const dependabot = readYaml('../.github/dependabot.yml')
for (const update of dependabot.updates) {
  assert.equal(update['target-branch'], 'development')
}
assert.ok(
  workflow('dependabot-auto-merge').jobs.merge.if.includes(
    ".base.ref == 'development'",
  ),
  'Dependency auto-merge must be restricted to integration PRs',
)

for (const name of readdirSync(
  new URL('../.github/workflows/', import.meta.url),
)) {
  if (!/\.ya?ml$/.test(name)) continue
  const config = readYaml(`../.github/workflows/${name}`)
  for (const job of Object.values(config.jobs)) {
    for (const step of job.steps ?? []) {
      const isDeployment =
        step.uses?.startsWith('cloudflare/wrangler-action@') ||
        /\bwrangler\s+deploy\b/.test(step.run ?? '')
      if (isDeployment) {
        assert.equal(
          name,
          'deploy.yml',
          'Only the production workflow may deploy automatically',
        )
        assert.equal(job.if, "github.ref == 'refs/heads/main'")
      }
    }
  }
}

console.log('Branch workflow boundaries passed.')
