import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'

const workflow = parse(
  await readFile('.github/workflows/dependabot-auto-merge.yml', 'utf8'),
)
const step = workflow.jobs.merge.steps.find(
  (item) => item.name === 'Merge tested update and dispatch deployment',
)
assert.equal(workflow.permissions.actions, 'write')
assert.ok(workflow.jobs.merge.if.includes("conclusion == 'success'"))
assert.ok(workflow.jobs.merge.if.includes("actor.login == 'dependabot[bot]'"))
assert.ok(
  workflow.jobs.merge.if.includes(
    'head_repository.full_name == github.repository',
  ),
)
assert.ok(
  !workflow.jobs.merge.steps.some((item) =>
    item.uses?.startsWith('actions/checkout'),
  ),
)
const execute = new (Object.getPrototypeOf(async function () {}).constructor)(
  'github',
  'context',
  'core',
  'process',
  step.with.script,
)

async function run(overrides = {}) {
  const calls = []
  const pr = {
    user: { login: 'dependabot[bot]' },
    draft: false,
    state: 'open',
    merged: false,
    base: { ref: 'master', repo: { full_name: 'owner/site' } },
    head: { sha: 'tested', repo: { full_name: 'owner/site' } },
    ...overrides.pr,
  }
  const github = {
    rest: {
      pulls: {
        get: async () => ({ data: pr }),
        merge: async (args) => {
          calls.push(['merge', args])
          if (overrides.mergeFails) throw new Error('Head changed')
          return {
            data: { merged: !overrides.mergeRefused, message: 'Not merged' },
          }
        },
      },
      repos: {
        getBranch: async () => ({
          data: { commit: { sha: overrides.base ?? 'base' } },
        }),
      },
      actions: {
        createWorkflowDispatch: async (args) => {
          calls.push(['dispatch', args])
          if (overrides.dispatchFails) throw new Error('Dispatch failed')
        },
      },
    },
  }
  await execute(
    github,
    {
      repo: { owner: 'owner', repo: 'site' },
      payload: {
        workflow_run: { head_sha: 'tested', pull_requests: [] },
      },
    },
    { info() {} },
    {
      env: {
        UPDATE_TYPE: overrides.type ?? 'version-update:semver-patch',
        PR_NUMBER: '1',
        TESTED_BASE: 'base',
      },
    },
  )
  return calls
}

for (const type of [
  'version-update:semver-patch',
  'version-update:semver-minor',
]) {
  const calls = await run({ type })
  assert.deepEqual(
    calls.map(([name]) => name),
    ['merge', 'dispatch'],
  )
  assert.equal(calls[0][1].sha, 'tested')
  assert.equal(calls[0][1].merge_method, 'squash')
  assert.equal(calls[1][1].workflow_id, 'deploy.yml')
  assert.equal(calls[1][1].ref, 'master')
}
for (const overrides of [
  { type: 'version-update:semver-major' },
  { type: '' },
  { pr: { user: { login: 'someone-else' } } },
  { pr: { draft: true } },
  { pr: { head: { sha: 'new-commit', repo: { full_name: 'owner/site' } } } },
  { pr: { head: { sha: 'tested', repo: { full_name: 'fork/site' } } } },
  { pr: { head: { sha: 'tested', repo: null } } },
  { pr: { base: { ref: 'other', repo: { full_name: 'owner/site' } } } },
  { pr: { state: 'closed' } },
  { base: 'new-base' },
])
  assert.deepEqual(await run(overrides), [])
await assert.rejects(run({ mergeFails: true }), /Head changed/)
await assert.rejects(run({ mergeRefused: true }), /Not merged/)
await assert.rejects(run({ dispatchFails: true }), /Dispatch failed/)
assert.deepEqual(
  (await run({ pr: { merged: true, state: 'closed' }, base: 'new-base' })).map(
    ([name]) => name,
  ),
  ['dispatch'],
)

const ci = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
const evidenceStep = workflow.jobs.merge.steps.find(
  (item) => item.id === 'tested',
)
const readEvidence = new (Object.getPrototypeOf(
  async function () {},
).constructor)('require', 'context', 'core', evidenceStep.with.script)
async function evidence(value) {
  const outputs = {}
  await readEvidence(
    () => ({ readFileSync: () => JSON.stringify(value) }),
    { payload: { workflow_run: { head_sha: 'tested', pull_requests: [] } } },
    {
      setOutput: (key, value) => {
        outputs[key] = value
      },
    },
  )
  return outputs
}
assert.deepEqual(
  await evidence({ number: 1, head: 'tested', base: 'a'.repeat(40) }),
  { number: 1, base: 'a'.repeat(40) },
)
for (const value of [
  { number: -1, head: 'tested', base: 'a'.repeat(40) },
  { number: 1, head: 'stale', base: 'a'.repeat(40) },
  { number: 1, head: 'tested', base: 'invalid' },
])
  await assert.rejects(evidence(value), /Invalid CI evidence/)
const ciCommands = ci.jobs.validate.steps
  .map((item) => item.run ?? '')
  .join('\n')
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
for (const name of [
  'check',
  'validate:data',
  'validate:ui',
  ...Object.keys(pkg.scripts).filter((name) => name.startsWith('test:')),
]) {
  assert.ok(
    ciCommands.includes(`npm run ${name}`),
    `${name} must run before automatic merging`,
  )
}
assert.ok(ciCommands.includes('npm run smoke:preview -- dist'))
console.log(
  'Dependabot merge guards, SHA matching, deployment dispatch/retry, and CI coverage pass.',
)
