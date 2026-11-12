import { loadTurnstile } from '../lib/turnstile'
import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'

import {
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

export default function PartnershipForm({
  turnstileSiteKey = '',
}: {
  turnstileSiteKey?: string
}) {
  const [interest, setInterest] = useState<string>(opportunities[0].value)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [widgetFailed, setWidgetFailed] = useState(false)
  const [verificationAttempt, setVerificationAttempt] = useState(0)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const token = useRef('')

  useEffect(() => {
    if (!turnstileSiteKey) return
    let cancelled = false
    token.current = ''
    const verificationFailed = () => {
      if (cancelled) return
      token.current = ''
      setWidgetFailed(true)
      setStatus('')
      setError(
        'The security check couldn’t load. Your details are still here. Select Send my inquiry to retry.',
      )
    }
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetRef.current) return
        widgetId.current = turnstile.render(widgetRef.current, {
          sitekey: turnstileSiteKey,
          // Compact keeps the widget inside a 320px screen.
          size: 'compact',
          appearance: 'interaction-only',
          callback: (value: string) => {
            token.current = value
            setWidgetFailed(false)
          },
          'expired-callback': () => (token.current = ''),
          'error-callback': verificationFailed,
        })
      })
      .catch(verificationFailed)
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
      token.current = ''
    }
  }, [turnstileSiteKey, verificationAttempt])

  const sendInquiry = async (form: HTMLFormElement) => {
    const data = new FormData(form)
    setError('')
    setStatus('')
    if (!turnstileSiteKey) {
      setError(
        'Sending is temporarily unavailable. Nothing has been sent. Keep this page open and try again later; your details are still here.',
      )
      return
    }
    if (widgetFailed) {
      setWidgetFailed(false)
      setVerificationAttempt((attempt) => attempt + 1)
      setStatus(
        'Retrying the security check. Once it completes, select Send my inquiry again.',
      )
      return
    }
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
      } else if (!result) {
        setStatus('')
        setError(
          'We couldn’t confirm delivery. Your details are still here. Please try again. If it was already received, a retry may send it again.',
        )
      } else if (response.status === 503) {
        setStatus('')
        setError(
          'Sending is temporarily unavailable. Nothing has been sent. Your details are still here. Please try again later.',
        )
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
          'We couldn’t send your inquiry just now. Your details are still here. Please try again.',
        )
      }
    } catch {
      setStatus('')
      setError(
        'We couldn’t confirm delivery. Your details are still here. Check your connection and try again. If it was already received, a retry may send it again.',
      )
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
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (sending) return
          void sendInquiry(event.currentTarget)
        }}
      >
        <fieldset className="min-w-0" disabled={sending}>
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
              readOnly={sending}
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
              readOnly={sending}
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </Field>
          <Field name="phone">
            <FieldLabel htmlFor="partner-phone">
              Phone number (optional)
            </FieldLabel>
            <Input
              className="min-h-11"
              id="partner-phone"
              name="phone"
              readOnly={sending}
              type="tel"
              autoComplete="tel"
              maxLength={30}
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
              readOnly={sending}
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
              readOnly={sending}
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
            Tell us about your business or story, what you hope to achieve, and
            any timing you have in mind. Add a website or social link if you
            have one.
          </FieldDescription>
          <Textarea
            id="partner-message"
            aria-describedby="partner-message-description"
            name="message"
            readOnly={sending}
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
            Your message is emailed to Ya Hala and used only to reply to you.
            This site doesn’t store it. Spam protection by Cloudflare Turnstile.
          </p>
          <div ref={widgetRef} className="mb-4 max-w-full" />
          <Button
            type="submit"
            aria-describedby="partner-delivery"
            aria-disabled={sending}
            className="min-h-12 w-full px-5 text-base whitespace-normal aria-disabled:pointer-events-none aria-disabled:opacity-70"
          >
            <Send aria-hidden="true" />
            {sending ? 'Sending…' : 'Send my inquiry'}
          </Button>
          <p role="status" aria-atomic="true" className="mt-3 text-sm">
            {status}
          </p>
          <p
            role="alert"
            aria-atomic="true"
            className="text-foreground mt-3 text-sm font-medium"
          >
            {error}
          </p>
        </div>
      </form>
    </div>
  )
}
