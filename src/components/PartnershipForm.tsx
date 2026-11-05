import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Mail, Send } from 'lucide-react'

import {
  formatPartnershipBody,
  partnershipInterests,
  partnershipLimits,
  partnershipPath,
} from '../lib/partnership'
import { Button } from './ui/button'
import { Field, FieldDescription, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Radio, RadioGroup } from './ui/radio-group'
import { Textarea } from './ui/textarea'

const descriptions = [
  'Put your brand behind the next journey.',
  'Introduce your local business and the people behind it.',
  'Tell us about someone our community should meet.',
]
const opportunities = partnershipInterests.map((value, index) => ({
  value,
  description: descriptions[index],
}))

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const loadTurnstile = () =>
  new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    const script = document.createElement('script')
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error('missing'))
    script.onerror = () => reject(new Error('blocked'))
    document.head.append(script)
  })

export default function PartnershipForm({
  email,
  instagramUrl,
  turnstileSiteKey = '',
}: {
  email: string
  instagramUrl?: string
  turnstileSiteKey?: string
}) {
  const [interest, setInterest] = useState<string>(opportunities[0].value)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [widgetFailed, setWidgetFailed] = useState(false)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const token = useRef('')
  // Direct sending needs a receiving inbox and Turnstile; otherwise the form
  // keeps the original email-draft behavior.
  const canSend = Boolean(email && turnstileSiteKey) && !widgetFailed

  useEffect(() => {
    if (!email || !turnstileSiteKey) return
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetRef.current) return
        widgetId.current = turnstile.render(widgetRef.current, {
          sitekey: turnstileSiteKey,
          // Compact keeps the widget inside a 320px screen.
          size: 'compact',
          appearance: 'interaction-only',
          callback: (value: string) => (token.current = value),
          'expired-callback': () => (token.current = ''),
          'error-callback': () => setWidgetFailed(true),
        })
      })
      .catch(() => setWidgetFailed(true))
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
      token.current = ''
    }
  }, [email, turnstileSiteKey])

  const prepareDraft = (data: FormData, notice = '') => {
    const body = formatPartnershipBody({
      interest: interest as (typeof partnershipInterests)[number],
      name: String(data.get('name')),
      email: String(data.get('email')),
      business: String(data.get('business') ?? ''),
      location: String(data.get('location') ?? ''),
      message: String(data.get('message')),
    })
    setDraft(body)
    if (!email) {
      setStatus(
        'Your inquiry is ready to copy below. Email delivery isn’t available yet. Nothing has been sent. You can send your inquiry to Ya Hala on Instagram.',
      )
      return
    }
    const mailto = `mailto:${email}?subject=${encodeURIComponent(`Ya Hala — ${interest}`)}&body=${encodeURIComponent(body)}`
    // shortcut: mailto handler limits vary; keep long inquiries available to copy.
    if (mailto.length > 1800) {
      setStatus(
        `${notice}Your inquiry is ready below. Copy it, then use the email link to send it. Nothing has been sent yet.`,
      )
      return
    }
    window.location.href = mailto
    setStatus(
      `${notice}Your email app should open with your inquiry. Nothing has been sent yet. Review the draft and send it there. If it doesn’t open, use the email address below; your details are still here.`,
    )
  }

  const sendInquiry = async (form: HTMLFormElement) => {
    const data = new FormData(form)
    if (!token.current) {
      setError(
        'We’re still checking that you’re human. Try sending again in a moment.',
      )
      return
    }
    setSending(true)
    setError('')
    setStatus('Sending your inquiry…')
    try {
      const response = await fetch(partnershipPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(data),
          interest,
          turnstileToken: token.current,
        }),
      })
      const result = await response.json().catch(() => null)
      if (response.ok && result?.ok) {
        form.reset()
        setInterest(opportunities[0].value)
        setStatus(
          'Thank you. Your inquiry was sent to Ya Hala. We’ll reply to the email address you gave us.',
        )
      } else if (!result || response.status === 503) {
        // No sending route here (local dev, or the Worker isn't configured yet).
        setStatus('')
        prepareDraft(data, 'Sending from this page isn’t available right now. ')
      } else if (result.errors) {
        setStatus('')
        setError(
          `Please check your details. ${Object.values(result.errors).join(' ')}`,
        )
      } else if (result.code === 'verification') {
        setStatus('')
        setError('The security check didn’t pass. Please try sending again.')
      } else {
        setStatus('')
        setError(
          'We couldn’t send your inquiry just now. Your details are still here. Try again, or email Ya Hala directly using the link below.',
        )
      }
    } catch {
      setStatus('')
      prepareDraft(data, 'We couldn’t reach the server. ')
    } finally {
      setSending(false)
      // Tokens are single-use; request a fresh one for the next attempt.
      token.current = ''
      if (widgetId.current) window.turnstile?.reset(widgetId.current)
    }
  }

  return (
    <div className="partnership-layout">
      <form
        method="dialog"
        className="ui-surface-card flex min-w-0 flex-col gap-6 p-5 sm:p-7"
        onInput={() => {
          if (sending) return
          setStatus('')
          setError('')
          setDraft('')
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (sending) return
          if (canSend) void sendInquiry(event.currentTarget)
          else prepareDraft(new FormData(event.currentTarget))
        }}
      >
        {!email && (
          <p className="text-muted-foreground text-sm">
            Prepare and copy your inquiry here. Email delivery isn’t available
            yet; you can contact Ya Hala on Instagram. Your details aren’t saved
            on this site.
          </p>
        )}
        <fieldset className="min-w-0">
          <legend
            id="partner-interest-title"
            className="mb-3 text-base font-semibold"
          >
            What would you like to do?
          </legend>
          <RadioGroup
            name="interest"
            value={interest}
            onValueChange={(value) => {
              setInterest(String(value))
              setStatus('')
              setDraft('')
            }}
            aria-labelledby="partner-interest-title"
          >
            {opportunities.map((option, index) => (
              <label key={option.value} className="partnership-choice">
                <Radio
                  value={option.value}
                  aria-labelledby={`partner-option-${index}`}
                  aria-describedby={`partner-option-description-${index}`}
                />
                <span className="min-w-0">
                  <span
                    id={`partner-option-${index}`}
                    className="block text-base font-semibold"
                  >
                    {option.value}
                  </span>
                  <span
                    id={`partner-option-description-${index}`}
                    className="text-muted-foreground mt-1 block text-sm"
                  >
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
        <div className="grid min-w-0 gap-5 sm:grid-cols-2">
          <Field name="name">
            <FieldLabel htmlFor="partner-name">Your name (required)</FieldLabel>
            <Input
              className="min-h-11"
              id="partner-name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
            />
          </Field>
          <Field name="email">
            <FieldLabel htmlFor="partner-email">
              Your email (required)
            </FieldLabel>
            <Input
              className="min-h-11"
              id="partner-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </Field>
          <Field name="business">
            <FieldLabel htmlFor="partner-business">
              Business / organization (optional)
            </FieldLabel>
            <Input
              className="min-h-11"
              id="partner-business"
              name="business"
              autoComplete="organization"
              maxLength={150}
            />
          </Field>
          <Field name="location">
            <FieldLabel htmlFor="partner-location">
              City / state (optional)
            </FieldLabel>
            <Input
              className="min-h-11"
              id="partner-location"
              name="location"
              maxLength={100}
            />
          </Field>
        </div>
        <Field name="message">
          <FieldLabel htmlFor="partner-message">
            What’s your idea? (required)
          </FieldLabel>
          <FieldDescription
            id="partner-message-description"
            className="text-sm"
          >
            A few lines about your story, business, or campaign. Add a website
            or social link if you have one.
          </FieldDescription>
          <Textarea
            id="partner-message"
            aria-describedby="partner-message-description"
            name="message"
            required
            maxLength={partnershipLimits.message}
            rows={4}
          />
        </Field>
        {/* Honeypot: invisible to people and assistive technology, filled by bots. */}
        <div aria-hidden="true" className="partnership-hp">
          <label>
            Leave this field empty
            <input
              type="text"
              name="hp_field"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </label>
        </div>
        <div>
          <p
            id="partner-delivery"
            className="text-muted-foreground mb-4 text-sm"
          >
            {canSend
              ? 'Your message is emailed to Ya Hala and used only to reply to you. This site doesn’t store it. Spam protection by Cloudflare Turnstile.'
              : email
                ? 'Opens a draft in your email app for you to review and send. Your details aren’t stored on this site.'
                : 'Email inquiries are being set up. You can contact Ya Hala on Instagram in the meantime.'}
          </p>
          {canSend && <div ref={widgetRef} className="mb-4 max-w-full" />}
          <Button
            type="submit"
            aria-describedby="partner-delivery"
            aria-disabled={sending}
            className="min-h-12 w-full px-5 text-base whitespace-normal aria-disabled:pointer-events-none aria-disabled:opacity-70"
          >
            {canSend ? (
              <Send aria-hidden="true" />
            ) : (
              <Mail aria-hidden="true" />
            )}
            {sending
              ? 'Sending…'
              : canSend
                ? 'Send my inquiry'
                : 'Prepare my inquiry'}
          </Button>
          <p role="status" aria-atomic="true" className="mt-3 text-sm">
            {status}
          </p>
          <p
            role="alert"
            aria-atomic="true"
            className="text-destructive mt-3 text-sm font-medium"
          >
            {error}
          </p>
          {draft && (
            <div className="mt-4">
              <label
                htmlFor="partner-draft"
                className="mb-2 block text-sm font-medium"
              >
                Your prepared inquiry
              </label>
              <textarea
                id="partner-draft"
                readOnly
                value={draft}
                rows={7}
                className="border-input bg-background w-full rounded-xl border p-3 text-base focus-visible:outline-2"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-2 min-h-11"
                onClick={async () => {
                  setStatus('')
                  try {
                    await navigator.clipboard.writeText(draft)
                    setStatus(
                      'Inquiry copied. Paste it into an email and send it to Ya Hala.',
                    )
                  } catch {
                    setStatus(
                      'Copying is unavailable. Select and copy the prepared inquiry above, then paste it into your email.',
                    )
                  }
                }}
              >
                Copy inquiry
              </Button>
            </div>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-foreground mt-2 block text-sm break-all underline underline-offset-4"
            >
              Email directly: {email}
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground mt-3 inline-flex min-h-11 items-center gap-1 text-sm underline underline-offset-4"
            >
              Prefer Instagram? Message Ya Hala
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </form>
    </div>
  )
}
