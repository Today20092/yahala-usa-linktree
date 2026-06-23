import * as React from 'react'

import { cn } from '@/lib/utils'

function Empty({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center',
        className,
      )}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="empty-title"
      className={cn('font-heading text-base font-medium', className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn('text-muted-foreground max-w-sm text-sm', className)}
      {...props}
    />
  )
}

export { Empty, EmptyDescription, EmptyTitle }
