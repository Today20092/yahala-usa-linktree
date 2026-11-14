import {
  EllipsisIcon,
  InfoIcon,
  LogOutIcon,
  RefreshCwIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode, type RefObject } from 'react'
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
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Collapsible, CollapsibleTrigger } from './ui/collapsible'
import { Empty, EmptyDescription, EmptyTitle } from './ui/empty'
import { Menu, MenuPopup, MenuTrigger } from './ui/menu'
import { Skeleton } from './ui/skeleton'
import { Tabs, TabsList, TabsPanel, TabsTab } from './ui/tabs'
import { toastManager } from './ui/toast'

// Shared by the Access-protected admin pages (testimonials and contact requests).

export type Phase = 'loading' | 'ready' | 'error' | 'unauthorized'

export const nowSql = () =>
  new Date().toISOString().slice(0, 19).replace('T', ' ')
export const parseDate = (value: string) =>
  new Date(`${value.replace(' ', 'T')}Z`)
export const formatDate = (value: string | Date) =>
  (typeof value === 'string' ? parseDate(value) : value).toLocaleDateString(
    undefined,
    { month: 'short', day: 'numeric', year: 'numeric' },
  )
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join('')

/**
 * Loads an admin list. `astro dev` has no Worker, so it falls back to labelled sample rows.
 * Pass `sample` as `import.meta.env.DEV ? () => import(...) : undefined` so production drops it.
 */
export function useAdminList<T>(
  api: string,
  key: string,
  sample?: () => Promise<T[]>,
) {
  const [items, setItems] = useState<T[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [reviewer, setReviewer] = useState('')
  const [isSample, setIsSample] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch(api, {
          headers: { Accept: 'application/json' },
        })
        if (sample && response.status === 404) {
          setItems(await sample())
          setIsSample(true)
          setPhase('ready')
          return
        }
        if (response.status === 401) return setPhase('unauthorized')
        if (!response.ok) throw new Error(String(response.status))
        const data = await response.json()
        setItems(data[key] ?? [])
        setReviewer(data.reviewer ?? '')
        setPhase('ready')
      } catch {
        setPhase('error')
      }
    })()
  }, [api, key])

  const save = async (body: { id: string; action: string }) => {
    if (isSample) return
    const response = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(String(response.status))
  }

  return { items, setItems, phase, reviewer, isSample, save }
}

export const saveFailedToast = () =>
  toastManager.add({
    type: 'error',
    title: 'That change wasn’t saved',
    description:
      'Your sign-in may have expired. Reload the page and try again.',
  })

export async function copyText(text: string, title: string) {
  try {
    await navigator.clipboard.writeText(text)
    toastManager.add({ type: 'success', title })
  } catch {
    toastManager.add({
      type: 'error',
      title: 'Couldn’t copy',
      description: 'Select the text and copy it instead.',
    })
  }
}

export function LoadFailure({
  phase,
  noun,
}: {
  phase: 'error' | 'unauthorized'
  noun: string
}) {
  return (
    <Alert variant="error">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>
        {phase === 'unauthorized'
          ? 'You’re not signed in'
          : `${noun} couldn’t load`}
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
}

export function SampleNotice({ noun }: { noun: string }) {
  return (
    <Alert role="note">
      <InfoIcon aria-hidden="true" />
      <AlertTitle>Sample data</AlertTitle>
      <AlertDescription>
        Local development doesn’t run the Cloudflare Worker, so these are
        example {noun} and changes aren’t saved.
      </AlertDescription>
    </Alert>
  )
}

export function AccountBar({ reviewer }: { reviewer: string }) {
  if (!reviewer) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="flex min-w-0 flex-col text-sm">
        <span className="text-muted-foreground">Signed in as</span>
        <span className="text-foreground truncate font-medium" title={reviewer}>
          {reviewer}
        </span>
      </p>
      <Button
        variant="outline"
        className="min-h-11"
        nativeButton={false}
        role="link"
        render={<a href="/cdn-cgi/access/logout" aria-label="Sign out" />}
      >
        <LogOutIcon data-icon="inline-start" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  )
}

export type StatusTab<S extends string> = {
  value: S
  label: string
  emptyTitle: string
  emptyText: string
}

/** Status tabs with counts, a loading state and an empty state per tab. */
export function StatusTabs<
  S extends string,
  T extends { id: string; status: S },
>({
  tabs,
  items,
  phase,
  value,
  onValueChange,
  listRef,
  renderItem,
}: {
  tabs: StatusTab<S>[]
  items: T[]
  phase: Phase
  value: S
  onValueChange: (value: S) => void
  listRef: RefObject<HTMLDivElement | null>
  renderItem: (item: T) => ReactNode
}) {
  const count = (status: S) =>
    items.filter((item) => item.status === status).length
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as S)}
      className="gap-5"
    >
      <TabsList className="w-full sm:w-fit">
        {tabs.map((tab, index) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            className="min-h-11 max-[359px]:h-auto max-[359px]:flex-col max-[359px]:gap-0.5 max-[359px]:px-2 max-[359px]:py-1.5 sm:min-h-9"
          >
            {tab.label}
            {phase === 'ready' && (
              // The first tab is the queue that needs attention.
              <Badge
                variant={
                  index === 0 && count(tab.value) ? 'default' : 'secondary'
                }
              >
                {count(tab.value)}
              </Badge>
            )}
          </TabsTab>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsPanel key={tab.value} value={tab.value}>
          <div
            ref={tab.value === value ? listRef : undefined}
            tabIndex={-1}
            aria-busy={phase === 'loading'}
            className="flex flex-col gap-4 outline-none"
          >
            {phase === 'loading' ? (
              [0, 1].map((key) => (
                <Skeleton key={key} className="h-52 rounded-xl" />
              ))
            ) : count(tab.value) ? (
              items.filter((item) => item.status === tab.value).map(renderItem)
            ) : (
              <Empty>
                <EmptyTitle>{tab.emptyTitle}</EmptyTitle>
                <EmptyDescription>{tab.emptyText}</EmptyDescription>
              </Empty>
            )}
          </div>
        </TabsPanel>
      ))}
    </Tabs>
  )
}

/** Long text is clamped to five lines with a toggle; screen readers always get the full text. */
export function ExpandableText({
  text,
  quoted = false,
}: {
  text: string
  quoted?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const long = text.length > 280
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <blockquote
        className={
          long && !expanded
            ? 'ui-body line-clamp-5 wrap-anywhere whitespace-pre-wrap'
            : 'ui-body wrap-anywhere whitespace-pre-wrap'
        }
        dir="auto"
      >
        {quoted ? `“${text}”` : text}
      </blockquote>
      {long && (
        <CollapsibleTrigger
          render={<Button variant="link" className="min-h-11 px-0" />}
        >
          {expanded
            ? 'Show less'
            : quoted
              ? 'Read full quote'
              : 'Read full message'}
        </CollapsibleTrigger>
      )}
    </Collapsible>
  )
}

export function MoreMenu({
  label,
  disabled,
  children,
}: {
  label: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="ms-auto min-h-11 min-w-11"
            aria-label={label}
            disabled={disabled}
          />
        }
      >
        <EllipsisIcon aria-hidden="true" />
      </MenuTrigger>
      <MenuPopup align="end">{children}</MenuPopup>
    </Menu>
  )
}

export function ConfirmDelete({
  title,
  description,
  open,
  onCancel,
  onConfirm,
}: {
  title: string
  description: ReactNode
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
            onClick={onConfirm}
          >
            <Trash2Icon data-icon="inline-start" aria-hidden="true" />
            Delete permanently
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
