import {
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  LogOutIcon,
  RefreshCwIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AdminTestimonial, TestimonialStatus } from '../lib/testimonials'
import { Alert, AlertAction, AlertDescription, AlertTitle } from './ui/alert'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Collapsible, CollapsibleTrigger } from './ui/collapsible'
import { Empty, EmptyDescription, EmptyTitle } from './ui/empty'
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from './ui/menu'
import { RatingDisplay } from './ui/rating'
import { Skeleton } from './ui/skeleton'
import { Spinner } from './ui/spinner'
import { Tabs, TabsList, TabsPanel, TabsTab } from './ui/tabs'
import { ToastProvider, toastManager } from './ui/toast'

const API = '/api/admin/testimonials'
type Action = 'approved' | 'rejected' | 'delete'

const TABS: { value: TestimonialStatus; label: string; empty: string }[] = [
  {
    value: 'pending',
    label: 'Pending',
    empty: 'New submissions appear here until you publish or reject them.',
  },
  {
    value: 'approved',
    label: 'Published',
    empty: 'Publish a pending testimonial to show it on the homepage.',
  },
  {
    value: 'rejected',
    label: 'Hidden',
    empty:
      'Rejected and hidden testimonials stay here, off the site, until you publish or delete them.',
  },
]

const parseDate = (value: string) => new Date(`${value.replace(' ', 'T')}Z`)
const formatDate = (value: string) =>
  parseDate(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join('')

export default function TestimonialAdmin() {
  return (
    <ToastProvider position="bottom-center">
      <Moderation />
    </ToastProvider>
  )
}

function Moderation() {
  const [items, setItems] = useState<AdminTestimonial[]>([])
  const [phase, setPhase] = useState<
    'loading' | 'ready' | 'error' | 'unauthorized'
  >('loading')
  const [reviewer, setReviewer] = useState('')
  const [sample, setSample] = useState(false)
  const [tab, setTab] = useState<TestimonialStatus>('pending')
  const [busyId, setBusyId] = useState('')
  const [confirming, setConfirming] = useState<AdminTestimonial | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setPhase('loading')
    try {
      const response = await fetch(API, {
        headers: { Accept: 'application/json' },
      })
      if (import.meta.env.DEV && response.status === 404) {
        const { sampleTestimonials } =
          await import('../lib/testimonial-admin-sample')
        setSample(true)
        setItems(sampleTestimonials)
        setPhase('ready')
        return
      }
      if (response.status === 401) return setPhase('unauthorized')
      if (!response.ok) throw new Error(String(response.status))
      const data = await response.json()
      setItems(data.testimonials ?? [])
      setReviewer(data.reviewer ?? '')
      setPhase('ready')
    } catch {
      setPhase('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const counts = Object.fromEntries(
    TABS.map(({ value }) => [
      value,
      items.filter((item) => item.status === value).length,
    ]),
  ) as Record<TestimonialStatus, number>

  // Open on the queue that needs attention; fall back to what is live.
  const opened = useRef(false)
  useEffect(() => {
    if (phase !== 'ready' || opened.current) return
    opened.current = true
    if (!counts.pending) setTab('approved')
  }, [phase])

  const act = async (item: AdminTestimonial, action: Action) => {
    setBusyId(item.id)
    try {
      if (!sample) {
        const response = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, action }),
        })
        if (!response.ok) throw new Error(String(response.status))
      }
      const updated: AdminTestimonial | null =
        action === 'delete'
          ? null
          : {
              ...item,
              status: action,
              reviewed_at: new Date()
                .toISOString()
                .slice(0, 19)
                .replace('T', ' '),
            }
      setItems((list) =>
        updated
          ? list.map((entry) => (entry.id === item.id ? updated : entry))
          : list.filter((entry) => entry.id !== item.id),
      )
      // The card leaves this tab, so keep keyboard focus inside the list.
      listRef.current?.focus()
      const name = item.name
      toastManager.add(
        action === 'delete'
          ? {
              type: 'success',
              title: 'Deleted',
              description: `${name}’s testimonial was permanently removed.`,
            }
          : {
              type: 'success',
              title: action === 'approved' ? 'Published' : 'Moved to Hidden',
              description:
                action === 'approved'
                  ? `${name}’s testimonial is now on the homepage.`
                  : `${name}’s testimonial is off the site.`,
              // Pending is not an admin action, so first decisions are reversed from the other tab.
              actionProps:
                updated && item.status !== 'pending'
                  ? {
                      children: 'Undo',
                      onClick: () => act(updated, item.status as Action),
                    }
                  : undefined,
            },
      )
    } catch {
      toastManager.add({
        type: 'error',
        title: 'That change wasn’t saved',
        description:
          'Your sign-in may have expired. Reload the page and try again.',
      })
    } finally {
      setBusyId('')
    }
  }

  const copy = async (item: AdminTestimonial) => {
    try {
      await navigator.clipboard.writeText(
        `“${item.quote}” — ${item.name}${item.role ? `, ${item.role}` : ''}`,
      )
      toastManager.add({ type: 'success', title: 'Quote copied' })
    } catch {
      toastManager.add({
        type: 'error',
        title: 'Couldn’t copy the quote',
        description: 'Select the text and copy it instead.',
      })
    }
  }

  if (phase === 'unauthorized' || phase === 'error')
    return (
      <Alert variant="error">
        <InfoIcon aria-hidden="true" />
        <AlertTitle>
          {phase === 'unauthorized'
            ? 'You’re not signed in'
            : 'Testimonials couldn’t load'}
        </AlertTitle>
        <AlertDescription>
          {phase === 'unauthorized'
            ? 'This page is protected by Cloudflare Access. Reload to sign in with an approved account.'
            : 'Your sign-in may have expired, or the service is unavailable. Reload the page to try again.'}
        </AlertDescription>
        <AlertAction>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => window.location.reload()}
          >
            <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
            Reload
          </Button>
        </AlertAction>
      </Alert>
    )

  return (
    <div className="flex flex-col gap-6">
      {sample && (
        <Alert role="note">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Sample data</AlertTitle>
          <AlertDescription>
            Local development doesn’t run the Cloudflare Worker, so these are
            example testimonials and changes aren’t saved.
          </AlertDescription>
        </Alert>
      )}

      {reviewer && (
        <div className="flex items-center justify-between gap-4">
          <p className="flex min-w-0 flex-col text-sm">
            <span className="text-muted-foreground">Signed in as</span>
            <span
              className="text-foreground truncate font-medium"
              title={reviewer}
            >
              {reviewer}
            </span>
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            nativeButton={false}
            render={<a href="/cdn-cgi/access/logout" aria-label="Sign out" />}
          >
            <LogOutIcon data-icon="inline-start" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TestimonialStatus)}
        className="gap-5"
      >
        <TabsList className="w-full sm:w-fit">
          {TABS.map(({ value, label }) => (
            <TabsTab
              key={value}
              value={value}
              className="min-h-11 max-[359px]:h-auto max-[359px]:flex-col max-[359px]:gap-0.5 max-[359px]:px-2 max-[359px]:py-1.5 sm:min-h-9"
            >
              {label}
              {phase === 'ready' && (
                <Badge
                  variant={
                    value === 'pending' && counts.pending
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {counts[value]}
                </Badge>
              )}
            </TabsTab>
          ))}
        </TabsList>
        {TABS.map(({ value, label, empty }) => (
          <TabsPanel key={value} value={value}>
            <div
              ref={value === tab ? listRef : undefined}
              tabIndex={-1}
              aria-busy={phase === 'loading'}
              className="flex flex-col gap-4 outline-none"
            >
              {phase === 'loading' ? (
                [0, 1].map((key) => (
                  <Skeleton key={key} className="h-52 rounded-xl" />
                ))
              ) : counts[value] ? (
                items
                  .filter((item) => item.status === value)
                  .map((item) => (
                    <TestimonialCard
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onAct={(action) => act(item, action)}
                      onCopy={() => copy(item)}
                      onDelete={() => setConfirming(item)}
                    />
                  ))
              ) : (
                <Empty>
                  <EmptyTitle>No {label.toLowerCase()} testimonials</EmptyTitle>
                  <EmptyDescription>{empty}</EmptyDescription>
                </Empty>
              )}
            </div>
          </TabsPanel>
        ))}
      </Tabs>

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.name}’s testimonial will be removed permanently. To
              take it off the site but keep it, hide it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" className="min-h-11" />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              className="min-h-11"
              onClick={() => {
                if (confirming) act(confirming, 'delete')
                setConfirming(null)
              }}
            >
              <Trash2Icon data-icon="inline-start" aria-hidden="true" />
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  )
}

function TestimonialCard({
  item,
  busy,
  onAct,
  onCopy,
  onDelete,
}: {
  item: AdminTestimonial
  busy: boolean
  onAct: (action: Action) => void
  onCopy: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const long = item.quote.length > 280
  const linkExpired =
    item.status === 'pending' && item.review_expires < Date.now()
  const busyIcon = busy ? <Spinner data-icon="inline-start" /> : null

  return (
    <Card aria-busy={busy}>
      <CardHeader className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(item.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 wrap-anywhere">
          <CardTitle dir="auto">{item.name}</CardTitle>
          {item.role && (
            <CardDescription dir="auto">{item.role}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <RatingDisplay value={item.rating} />
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <blockquote
            className={
              long && !expanded
                ? 'ui-body line-clamp-5 wrap-anywhere whitespace-pre-wrap'
                : 'ui-body wrap-anywhere whitespace-pre-wrap'
            }
            dir="auto"
          >
            “{item.quote}”
          </blockquote>
          {long && (
            <CollapsibleTrigger
              render={<Button variant="link" className="min-h-11 px-0" />}
            >
              {expanded ? 'Show less' : 'Read full quote'}
            </CollapsibleTrigger>
          )}
        </Collapsible>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
          <span>Submitted {formatDate(item.consent_at)}</span>
          {item.reviewed_at && item.status !== 'pending' && (
            <span>
              · {item.status === 'approved' ? 'Published' : 'Hidden'}{' '}
              {formatDate(item.reviewed_at)}
            </span>
          )}
          {linkExpired && <Badge variant="outline">Email link expired</Badge>}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {item.status === 'pending' && (
          <>
            <Button
              className="min-h-11"
              disabled={busy}
              onClick={() => onAct('approved')}
            >
              {busyIcon ?? (
                <CheckIcon data-icon="inline-start" aria-hidden="true" />
              )}
              Publish
            </Button>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => onAct('rejected')}
            >
              <XIcon data-icon="inline-start" aria-hidden="true" />
              Reject
            </Button>
          </>
        )}
        {item.status === 'approved' && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => onAct('rejected')}
          >
            {busyIcon ?? (
              <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
            )}
            Hide from site
          </Button>
        )}
        {item.status === 'rejected' && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => onAct('approved')}
          >
            {busyIcon ?? (
              <EyeIcon data-icon="inline-start" aria-hidden="true" />
            )}
            Publish
          </Button>
        )}
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="ms-auto min-h-11 min-w-11"
                aria-label={`More actions for ${item.name}`}
                disabled={busy}
              />
            }
          >
            <EllipsisIcon aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuGroup>
              <MenuItem onClick={onCopy}>
                <CopyIcon aria-hidden="true" />
                Copy quote
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuGroup>
              <MenuItem variant="destructive" onClick={onDelete}>
                <Trash2Icon aria-hidden="true" />
                Delete permanently
              </MenuItem>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </CardFooter>
    </Card>
  )
}
