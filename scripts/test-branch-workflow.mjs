import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { parse } from 'yaml'

const readYaml = (path) =>
  parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const workflow = (name) => readYaml(`../.github/workflows/${name}.yml`)
const ci = workflow('ci')
assert.deepEqual(ci.on.push.branches, ['main'])
assert.deepEqual(ci.on.pull_request.branches, ['main'])

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
assert.equal(checkout.with.ref, 'main')
assert.equal(checkout.with['fetch-depth'], 0)
const prIndex = refreshJob.steps.findIndex((step) =>
  step.uses?.startsWith('peter-evans/create-pull-request@'),
)
assert.ok(prIndex >= 0, 'Catalog updates must go through a pull request')
const catalogPr = refreshJob.steps[prIndex]
assert.equal(catalogPr.with.base, 'main')
assert.equal(catalogPr.with.branch, 'automation/youtube-catalog')
assert.equal(refresh.permissions['pull-requests'], 'write')
assert.equal(refresh.permissions.actions, 'write')
const precedingCommands = refreshJob.steps
  .slice(0, prIndex)
  .map((step) => step.run ?? '')
  .join('\n')
const dispatch = refreshJob.steps.find((step) =>
  step.run?.includes('gh workflow run ci.yml'),
)
assert.ok(refreshJob.steps.indexOf(dispatch) > prIndex)
for (const name of ['ci', 'preview-smoke']) {
  assert.ok(
    dispatch.run.includes(
      `gh workflow run ${name}.yml --ref automation/youtube-catalog`,
    ),
    `${name} must run on the catalog PR head for required status checks`,
  )
  assert.ok('workflow_dispatch' in workflow(name).on)
}
assert.equal(ci.jobs.validate.name, 'Validate and build')
assert.ok(workflow('preview-smoke').jobs.smoke)
assert.equal(dispatch.env.GH_TOKEN, '${{ secrets.GITHUB_TOKEN }}')
assert.equal(dispatch.if, 'steps.catalog-pr.outputs.pull-request-number')
assert.ok(
  catalogPr.with['add-paths']
    .split('\n')
    .filter(Boolean)
    .every((path) => path.startsWith('src/data/')),
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
    `${check} must pass before a catalog pull request is opened`,
  )
}

for (const name of readdirSync(
  new URL('../.github/workflows/', import.meta.url),
)) {
  if (!/\.ya?ml$/.test(name)) continue
  const config = readYaml(`../.github/workflows/${name}`)
  assert.doesNotMatch(JSON.stringify(config), /\bdevelopment\b/)
  for (const job of Object.values(config.jobs)) {
    for (const step of job.steps ?? []) {
      assert.ok(
        !step.with?.script?.includes("workflow_id: 'deploy.yml'"),
        'PR automation must not dispatch production deployment',
      )
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
