import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import PartnershipForm from '../src/components/PartnershipForm'

const tokens = readFileSync('tokens.css', 'utf8')
assert.match(
  tokens,
  /--input:\s*var\(--color-ink-2\)/,
  'Field boundaries need the contrasting control token, not a decorative divider',
)
const buttons = readFileSync('src/components/ui/button.tsx', 'utf8')
assert.match(
  buttons,
  /hover:bg-\[color-mix\(in_oklch,var\(--primary\),var\(--foreground\)_10%\)\]/,
  'Primary hover must preserve contrast instead of fading the background',
)
assert.match(
  tokens,
  /--primary:\s*var\(--brand-action\)/,
  'Primary actions must use the brand token, independent of Tailwind’s accent alias',
)
assert.doesNotMatch(
  tokens,
  /--primary:\s*var\(--color-accent\)/,
  'Tailwind’s accent alias resolves to a pale surface and makes the action unreadable',
)

const unavailable = renderToStaticMarkup(<PartnershipForm />)
assert.match(
  unavailable,
  /<form/,
  'The full form must stay available with a blank receiving inbox',
)
assert.match(unavailable, /Send my inquiry/)
assert.doesNotMatch(
  unavailable,
  /mailto:/,
  'Do not open a draft without a receiving inbox',
)
const submit = unavailable.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0]
assert.ok(submit, 'The inquiry preparation action is available')
assert.doesNotMatch(submit, /\sdisabled(?:=|\s|>)/)
assert.doesNotMatch(
  unavailable,
  /instagram\.com|Email directly|Prepare my inquiry/,
)

const configured = renderToStaticMarkup(
  <PartnershipForm turnstileSiteKey="test-key" />,
)
assert.match(
  configured,
  /method="dialog"/,
  'Unhydrated form must never submit personal details to the page URL',
)
assert.match(configured, /aria-labelledby="partner-interest-title"/)
for (const name of ['name', 'email', 'message']) {
  const control = configured
    .match(/<(?:input|textarea)\b[^>]*>/g)
    ?.find((tag) => tag.includes(`name="${name}"`))
  assert.ok(control, `Missing ${name} control`)
  assert.ok(control.includes('required'), `${name} must be required`)
  assert.ok(
    control.includes(`id="partner-${name}"`),
    `${name} must match its visible label`,
  )
  assert.match(configured, new RegExp(`for="partner-${name}"`))
}
assert.match(
  configured,
  /Your message is emailed to Ya Hala/,
  'Delivery must be described honestly',
)
assert.doesNotMatch(configured, /mailto:/)
console.log('Partnership form-only markup, labels and submission safety passed.')
