import { useEffect, useRef, useState } from 'react'
import type { Testimonial } from '../lib/testimonials'
import { Button } from './ui/button'

export default function TestimonialReview() {
  const credentials = useRef({ id: '', token: '' })
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null)
  const [decision, setDecision] = useState('approved')
  const [status, setStatus] = useState('Loading testimonial…')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)

  useEffect(() => {
    const load = () => {
      setTestimonial(null)
      setError('')
      setStatus('Loading testimonial…')
      const [id, token, action] = window.location.hash.slice(1).split('.')
      window.history.replaceState(null, '', window.location.pathname)
      if (!id || !token || !['approved', 'rejected'].includes(action)) {
        setStatus('')
        setError(
          'This review link is incomplete. Open the full link from your email.',
        )
        return
      }
      credentials.current = { id, token }
      setDecision(action)
      fetch('/api/testimonials/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, action: 'preview' }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error('review')
          const result = await response.json()
          setTestimonial(result.testimonial)
          setStatus('')
        })
        .catch(() => {
          setStatus('')
          setError(
            'This link has expired, has already been used, or review is temporarily unavailable. Try opening the email link again. Approval links expire after 14 days.',
          )
        })
    }
    load()
    window.addEventListener('hashchange', load)
    return () => window.removeEventListener('hashchange', load)
  }, [])

  const decide = async (action: string) => {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/testimonials/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials.current, action }),
      })
      if (!response.ok) throw new Error('review')
      setTestimonial(null)
      setStatus(
        action === 'approved'
          ? 'Approved. This testimonial will appear in the homepage carousel.'
          : 'Rejected. This testimonial will stay off the site.',
      )
      credentials.current = { id: '', token: '' }
    } catch {
      setError(
        'The decision could not be saved. Try again, or reopen the email link if it has already been used.',
      )
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p role="status" className="ui-body">
        {status}
      </p>
      {error && (
        <p role="alert" className="text-destructive-foreground">
          {error}
        </p>
      )}
      {testimonial && (
        <>
          <figure className="ui-surface-card flex flex-col gap-5 p-6">
            <p className="text-muted-foreground text-sm">
              Rating: {testimonial.rating} / 5
            </p>
            <blockquote
              className="ui-body wrap-anywhere whitespace-pre-wrap"
              dir="auto"
            >
              “{testimonial.quote}”
            </blockquote>
            <figcaption className="min-w-0 wrap-anywhere">
              <p className="font-semibold" dir="auto">
                {testimonial.name}
              </p>
              <p className="text-muted-foreground text-sm" dir="auto">
                {testimonial.role}
              </p>
            </figcaption>
          </figure>
          <p className="ui-body">
            The client has given permission to publish these details. Nothing is
            published until you confirm approval.
          </p>
          <div className="flex flex-wrap gap-3" aria-busy={busy}>
            <Button
              className="min-h-11"
              variant={decision === 'approved' ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => decide('approved')}
            >
              Confirm approval
            </Button>
            <Button
              className="min-h-11"
              variant={decision === 'rejected' ? 'default' : 'outline'}
              disabled={busy}
              onClick={() => decide('rejected')}
            >
              Confirm rejection
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
