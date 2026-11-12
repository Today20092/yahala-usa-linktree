import { useEffect, useRef, useState } from 'react'
import { CheckCircle2Icon } from 'lucide-react'
import { loadTurnstile } from '../lib/turnstile'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Form } from './ui/form'
import { Rating } from './ui/rating'
import { Spinner } from './ui/spinner'
import { Field, FieldDescription, FieldError, FieldLabel } from './ui/field'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

export default function TestimonialForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string
}) {
  const [quoteLength, setQuoteLength] = useState(0)
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const widget = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const token = useRef('')
  const sending = useRef(false)
  const confirmation = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (sent) {
      confirmation.current?.focus()
      return
    }
    let cancelled = false
    const failed = () => {
      if (cancelled) return
      token.current = ''
      setReady(false)
      setError(
        'The security check could not load. Please retry. / تعذّر تحميل التحقق الأمني. يرجى المحاولة مجددًا.',
      )
    }
    if (!turnstileSiteKey) {
      failed()
      return
    }
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widget.current) return
        widgetId.current = turnstile.render(widget.current, {
          sitekey: turnstileSiteKey,
          action: 'testimonial',
          size: 'compact',
          appearance: 'interaction-only',
          callback: (value: string) => {
            token.current = value
            setReady(true)
          },
          'expired-callback': () => {
            token.current = ''
            setReady(false)
          },
          'error-callback': failed,
        })
      })
      .catch(failed)
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
      token.current = ''
    }
  }, [attempt, sent, turnstileSiteKey])

  if (sent)
    return (
      <Alert role="status" className="gap-y-4">
        <CheckCircle2Icon aria-hidden="true" />
        <AlertDescription>
          <h2 ref={confirmation} tabIndex={-1} className="ui-section-title">
            Thank you for sharing your experience.
          </h2>
          <p className="ui-body" lang="ar" dir="rtl">
            شكرًا لمشاركتنا تجربتك.
          </p>
          <p className="ui-body">
            Your testimonial has been sent to Ya Hala for review. It will appear
            on the site only after approval.
          </p>
          <p className="ui-body" lang="ar" dir="rtl">
            تم إرسال شهادتك إلى فريق ياهلا للمراجعة. لن تظهر على الموقع إلا بعد
            الموافقة عليها.
          </p>
        </AlertDescription>
      </Alert>
    )

  return (
    <Form
      className="flex flex-col gap-6"
      onSubmit={async (event) => {
        event.preventDefault()
        if (sending.current) return
        if (!token.current) {
          setError(
            'Please complete the security check. / يرجى إكمال التحقق الأمني.',
          )
          return
        }
        const data = new FormData(event.currentTarget)
        sending.current = true
        setBusy(true)
        setError('')
        try {
          const response = await fetch('/api/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.get('name'),
              role: data.get('role'),
              quote: data.get('quote'),
              rating: Number(data.get('rating')),
              consent: data.get('consent') === 'on',
              hp_field: data.get('hp_field'),
              turnstileToken: token.current,
            }),
          })
          if (!response.ok) throw new Error('submit')
          setSent(true)
        } catch {
          setError(
            'Your testimonial was not sent. Your words are still here; please try again. / لم يتم إرسال شهادتك. ما كتبته لا يزال محفوظًا هنا؛ يرجى المحاولة مجددًا.',
          )
          token.current = ''
          setReady(false)
          if (widgetId.current) window.turnstile?.reset(widgetId.current)
        } finally {
          sending.current = false
          setBusy(false)
        }
      }}
    >
      <div className="partnership-hp" aria-hidden="true">
        <label htmlFor="testimonial-website">Website</label>
        <input
          id="testimonial-website"
          name="hp_field"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <Field name="name">
        <FieldLabel htmlFor="testimonial-name">
          Your name{' '}
          <span lang="ar" dir="rtl">
            الاسم
          </span>
        </FieldLabel>
        <Input
          id="testimonial-name"
          name="name"
          autoComplete="name"
          dir="auto"
          maxLength={100}
          required
        />
        <FieldError />
      </Field>
      <Field name="role">
        <FieldLabel htmlFor="testimonial-role">
          Business / role{' '}
          <span lang="ar" dir="rtl">
            العمل / المسمى الوظيفي
          </span>
        </FieldLabel>
        <Input
          id="testimonial-role"
          name="role"
          autoComplete="organization"
          dir="auto"
          maxLength={150}
        />
        <FieldDescription>
          Optional / <span lang="ar">اختياري</span>
        </FieldDescription>
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend id="testimonial-rating-title" className="mb-3 font-medium">
          Your rating /{' '}
          <span lang="ar" dir="rtl">
            تقييمك
          </span>
        </legend>
        <Field
          name="rating"
          validate={(value) =>
            Number(value) >= 1 ? null : 'Choose a star / اختر نجمة'
          }
        >
          <Rating
            name="rating"
            required
            value={rating}
            onValueChange={setRating}
            size="lg"
            aria-labelledby="testimonial-rating-title"
            aria-describedby="testimonial-rating-help"
          />
          <p
            id="testimonial-rating-help"
            className="text-muted-foreground text-sm"
          >
            {rating
              ? `${rating} out of 5 / ${rating} من ٥`
              : 'Choose a star / اختر نجمة'}
          </p>
          <FieldError />
        </Field>
      </fieldset>
      <Field name="quote">
        <FieldLabel htmlFor="testimonial-quote">
          Your experience with Ya Hala{' '}
          <span lang="ar" dir="rtl">
            تجربتك مع ياهلا
          </span>
        </FieldLabel>
        <Textarea
          id="testimonial-quote"
          name="quote"
          dir="auto"
          rows={6}
          onChange={(event) => setQuoteLength(event.currentTarget.value.length)}
          minLength={20}
          maxLength={1200}
          required
          aria-describedby="testimonial-help"
        />
        <FieldDescription id="testimonial-help">
          What did we work on together, and what stood out? 20 to 1,200
          characters.
          <br />
          <span lang="ar" dir="rtl">
            ما العمل الذي جمعنا، وما الذي أعجبك في التجربة؟ من ٢٠ إلى ١٢٠٠ حرف.
          </span>
        </FieldDescription>
        <p className="text-muted-foreground self-end text-xs" aria-live="off">
          {quoteLength.toLocaleString()} / 1,200
        </p>
        <FieldError />
      </Field>
      <Field name="consent">
        <label
          htmlFor="testimonial-consent"
          className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed"
        >
          <Checkbox
            id="testimonial-consent"
            className="mt-1"
            name="consent"
            value="on"
            required
          />
          <span>
            I give Ya Hala permission to publish my testimonial, name, business
            or role, and rating on this website after review.
            <br />
            <span lang="ar" dir="rtl">
              أسمح لياهلا بنشر شهادتي واسمي وعملي أو مسماي الوظيفي وتقييمي على
              هذا الموقع بعد المراجعة.
            </span>
          </span>
        </label>
        <FieldError />
      </Field>
      <p className="text-muted-foreground text-sm">
        Please share only details you are happy to make public. Spam protection
        by Cloudflare Turnstile.
        <br />
        <span lang="ar" dir="rtl">
          يرجى مشاركة المعلومات التي ترغب في نشرها فقط. الحماية من الرسائل
          المزعجة بواسطة Cloudflare Turnstile.
        </span>
      </p>
      <div ref={widget} />
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!ready && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-start"
          onClick={() => {
            setError('')
            setAttempt((value) => value + 1)
          }}
        >
          Retry security check / إعادة التحقق
        </Button>
      )}
      <Button
        type="submit"
        disabled={busy || !ready}
        className="min-h-12 w-full sm:w-auto sm:self-start"
        aria-busy={busy}
      >
        {busy && (
          <Spinner
            data-icon="inline-start"
            aria-hidden="true"
            role={undefined}
          />
        )}
        {busy ? 'Sending… / جارٍ الإرسال…' : 'Send testimonial / إرسال الشهادة'}
      </Button>
    </Form>
  )
}
