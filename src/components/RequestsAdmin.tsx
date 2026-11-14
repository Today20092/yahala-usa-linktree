import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BuildingIcon,
  CheckIcon,
  CopyIcon,
  InboxIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ReplyIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AdminRequest, RequestStatus } from '../lib/partnership'
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
  parseDate,
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
import { Spinner } from './ui/spinner'
import { ToastProvider, toastManager } from './ui/toast'

type Action = RequestStatus | 'delete'

const TABS: StatusTab<RequestStatus>[] = [
  {
    value: 'new',
    label: 'New',
    emptyTitle: 'No new requests',
    emptyText:
      'Contact form messages appear here as well as in your email. Mark them replied once you answer.',
  },
  {
    value: 'replied',
    label: 'Replied',
    emptyTitle: 'No replied requests',
    emptyText: 'Requests you have answered appear here until you archive them.',
  },
  {
    value: 'archived',
    label: 'Archived',
    emptyTitle: 'No archived requests',
    emptyText:
      'Archived requests are deleted automatically 12 months after you archive them.',
  },
]

const MOVED: Record<RequestStatus, { title: string; description: string }> = {
  new: { title: 'Moved to New', description: 'is back in the New tab.' },
  replied: { title: 'Marked replied', description: 'is in the Replied tab.' },
  archived: {
    title: 'Archived',
    description: 'will be deleted automatically in 12 months.',
  },
}

const retentionEnd = (archivedAt: string) => {
  const date = parseDate(archivedAt)
  date.setUTCFullYear(date.getUTCFullYear() + 1)
  return formatDate(date)
}

const replyLink = (item: AdminRequest) =>
  `mailto:${encodeURIComponent(item.email).replace('%40', '@')}?subject=${encodeURIComponent(`Re: ${item.interest} — Ya Hala`)}`

export default function RequestsAdmin() {
  return (
    <ToastProvider position="bottom-center">
      <Requests />
    </ToastProvider>
  )
}

function Requests() {
  const { items, setItems, phase, reviewer, isSample, save } =
    useAdminList<AdminRequest>(
      '/api/admin/requests',
      'requests',
      import.meta.env.DEV
        ? () => import('../lib/admin-sample').then((m) => m.sampleRequests)
        : undefined,
    )
  const [tab, setTab] = useState<RequestStatus>('new')
  const [busyId, setBusyId] = useState('')
  const [confirming, setConfirming] = useState<AdminRequest | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Open on unanswered requests; fall back to the ones awaiting archive.
  const opened = useRef(false)
  useEffect(() => {
    if (phase !== 'ready' || opened.current) return
    opened.current = true
    if (
      !items.some((item) => item.status === 'new') &&
      items.some((item) => item.status === 'replied')
    )
      setTab('replied')
  }, [phase])

  const act = async (item: AdminRequest, action: Action) => {
    setBusyId(item.id)
    try {
      await save({ id: item.id, action })
      const now = nowSql()
      const updated: AdminRequest | null =
        action === 'delete'
          ? null
          : {
              ...item,
              status: action,
              updated_at: now,
              archived_at: action === 'archived' ? now : null,
            }
      setItems((list) =>
        updated
          ? list.map((entry) => (entry.id === item.id ? updated : entry))
          : list.filter((entry) => entry.id !== item.id),
      )
      // The card leaves this tab, so keep keyboard focus inside the list.
      listRef.current?.focus()
      toastManager.add(
        updated
          ? {
              type: 'success',
              title: MOVED[updated.status].title,
              description: `${item.name}’s request ${MOVED[updated.status].description}`,
              actionProps: {
                children: 'Undo',
                onClick: () => act(updated, item.status),
              },
            }
          : {
              type: 'success',
              title: 'Deleted',
              description: `${item.name}’s request was permanently removed.`,
            },
      )
    } catch {
      saveFailedToast()
    } finally {
      setBusyId('')
    }
  }

  if (phase === 'unauthorized' || phase === 'error')
    return <LoadFailure phase={phase} noun="Requests" />

  return (
    <div className="flex flex-col gap-6">
      {isSample && <SampleNotice noun="requests" />}
      <AccountBar reviewer={reviewer} />
      <StatusTabs
        tabs={TABS}
        items={items}
        phase={phase}
        value={tab}
        onValueChange={setTab}
        listRef={listRef}
        renderItem={(item) => (
          <RequestCard
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
        title="Delete this request?"
        description={`${confirming?.name}’s request will be removed permanently from this page. The original email stays in your inbox. To keep it for 12 months instead, archive it.`}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) act(confirming, 'delete')
          setConfirming(null)
        }}
      />
    </div>
  )
}

function RequestCard({
  item,
  busy,
  onAct,
  onDelete,
}: {
  item: AdminRequest
  busy: boolean
  onAct: (action: Action) => void
  onDelete: () => void
}) {
  const busyIcon = busy ? <Spinner data-icon="inline-start" /> : null
  const details = [
    {
      icon: MailIcon,
      label: 'Email',
      value: (
        <a
          href={replyLink(item)}
          className="wrap-anywhere underline underline-offset-4"
        >
          {item.email}
        </a>
      ),
    },
    item.phone && {
      icon: PhoneIcon,
      label: 'Phone',
      value: (
        <a
          href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}
          className="underline underline-offset-4"
        >
          {item.phone}
        </a>
      ),
    },
    item.business && {
      icon: BuildingIcon,
      label: 'Business',
      value: <span dir="auto">{item.business}</span>,
    },
    item.location && {
      icon: MapPinIcon,
      label: 'City / state',
      value: <span dir="auto">{item.location}</span>,
    },
  ].filter(Boolean) as {
    icon: typeof MailIcon
    label: string
    value: React.ReactNode
  }[]

  return (
    <Card aria-busy={busy}>
      <CardHeader className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initials(item.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 wrap-anywhere">
          <CardTitle dir="auto">{item.name}</CardTitle>
          <CardDescription>
            <Badge variant="secondary">{item.interest}</Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-2.5 gap-y-1.5 text-sm">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground translate-y-0.5">
                <Icon className="size-4" aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </dt>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
        <ExpandableText text={item.message} />
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
          <span>Received {formatDate(item.created_at)}</span>
          {item.status === 'replied' && item.updated_at && (
            <span>· Replied {formatDate(item.updated_at)}</span>
          )}
          {item.status === 'archived' && item.archived_at && (
            <span>· Deletes {retentionEnd(item.archived_at)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {item.status !== 'archived' && (
          <Button
            variant={item.status === 'new' ? 'default' : 'outline'}
            className="min-h-11"
            nativeButton={false}
            role="link"
            render={
              <a
                href={replyLink(item)}
                aria-label={`Reply by email to ${item.name}`}
              />
            }
          >
            <ReplyIcon data-icon="inline-start" aria-hidden="true" />
            Reply by email
          </Button>
        )}
        {item.status === 'new' && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => onAct('replied')}
          >
            {busyIcon ?? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            )}
            Mark replied
          </Button>
        )}
        {item.status === 'replied' && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => onAct('archived')}
          >
            {busyIcon ?? (
              <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
            )}
            Archive
          </Button>
        )}
        {item.status === 'archived' && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => onAct('new')}
          >
            {busyIcon ?? (
              <ArchiveRestoreIcon data-icon="inline-start" aria-hidden="true" />
            )}
            Move to New
          </Button>
        )}
        <MoreMenu label={`More actions for ${item.name}`} disabled={busy}>
          <MenuGroup>
            <MenuItem onClick={() => copyText(item.email, 'Email copied')}>
              <CopyIcon aria-hidden="true" />
              Copy email
            </MenuItem>
            {item.status === 'new' && (
              <MenuItem onClick={() => onAct('archived')}>
                <ArchiveIcon aria-hidden="true" />
                Archive
              </MenuItem>
            )}
            {item.status === 'replied' && (
              <MenuItem onClick={() => onAct('new')}>
                <InboxIcon aria-hidden="true" />
                Move to New
              </MenuItem>
            )}
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
