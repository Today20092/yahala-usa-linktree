import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AdminTestimonial, TestimonialStatus } from '../lib/testimonials'
import {
  AccountBar,
  ConfirmDelete,
  copyText,
  ExpandableText,
  formatDate,
  initials,
  LoadFailure,
  MoreMenu,
  nowSql,
  SampleNotice,
  saveFailedToast,
  StatusTabs,
  useAdminList,
  type StatusTab,
} from './AdminShared'
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
import { MenuGroup, MenuItem, MenuSeparator } from './ui/menu'
import { RatingDisplay } from './ui/rating'
import { Spinner } from './ui/spinner'
import { ToastProvider, toastManager } from './ui/toast'

type Action = 'approved' | 'rejected' | 'delete'

const TABS: StatusTab<TestimonialStatus>[] = [
  {
    value: 'pending',
    label: 'Pending',
    emptyTitle: 'No pending testimonials',
    emptyText: 'New submissions appear here until you publish or reject them.',
  },
  {
    value: 'approved',
    label: 'Published',
    emptyTitle: 'No published testimonials',
    emptyText: 'Publish a pending testimonial to show it on the homepage.',
  },
  {
    value: 'rejected',
    label: 'Hidden',
    emptyTitle: 'No hidden testimonials',
    emptyText:
      'Rejected and hidden testimonials stay here, off the site, until you publish or delete them.',
  },
]

export default function TestimonialAdmin() {
  return (
    <ToastProvider position="bottom-center">
      <Moderation />
    </ToastProvider>
  )
}

function Moderation() {
  const { items, setItems, phase, reviewer, isSample, save } =
    useAdminList<AdminTestimonial>(
      '/api/admin/testimonials',
      'testimonials',
      import.meta.env.DEV
        ? () => import('../lib/admin-sample').then((m) => m.sampleTestimonials)
        : undefined,
    )
  const [tab, setTab] = useState<TestimonialStatus>('pending')
  const [busyId, setBusyId] = useState('')
  const [confirming, setConfirming] = useState<AdminTestimonial | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Open on the queue that needs attention; fall back to what is live.
  const opened = useRef(false)
  useEffect(() => {
    if (phase !== 'ready' || opened.current) return
    opened.current = true
    if (!items.some((item) => item.status === 'pending')) setTab('approved')
  }, [phase])

  const act = async (item: AdminTestimonial, action: Action) => {
    setBusyId(item.id)
    try {
      await save({ id: item.id, action })
      const updated: AdminTestimonial | null =
        action === 'delete'
          ? null
          : { ...item, status: action, reviewed_at: nowSql() }
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
      saveFailedToast()
    } finally {
      setBusyId('')
    }
  }

  if (phase === 'unauthorized' || phase === 'error')
    return <LoadFailure phase={phase} noun="Testimonials" />

  return (
    <div className="flex flex-col gap-6">
      {isSample && <SampleNotice noun="testimonials" />}
      <AccountBar reviewer={reviewer} />
      <StatusTabs
        tabs={TABS}
        items={items}
        phase={phase}
        value={tab}
        onValueChange={setTab}
        listRef={listRef}
        renderItem={(item) => (
          <TestimonialCard
            key={item.id}
            item={item}
            busy={busyId === item.id}
            onAct={(action) => act(item, action)}
            onDelete={() => setConfirming(item)}
          />
        )}
      />
      <ConfirmDelete
        open={confirming !== null}
        title="Delete this testimonial?"
        description={`${confirming?.name}’s testimonial will be removed permanently. To take it off the site but keep it, hide it instead.`}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) act(confirming, 'delete')
          setConfirming(null)
        }}
      />
    </div>
  )
}

function TestimonialCard({
  item,
  busy,
  onAct,
  onDelete,
}: {
  item: AdminTestimonial
  busy: boolean
  onAct: (action: Action) => void
  onDelete: () => void
}) {
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
        <ExpandableText text={item.quote} quoted />
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
        <MoreMenu label={`More actions for ${item.name}`} disabled={busy}>
          <MenuGroup>
            <MenuItem
              onClick={() =>
                copyText(
                  `“${item.quote}” — ${item.name}${item.role ? `, ${item.role}` : ''}`,
                  'Quote copied',
                )
              }
            >
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
        </MoreMenu>
      </CardFooter>
    </Card>
  )
}
