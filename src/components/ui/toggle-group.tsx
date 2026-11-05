import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'

// Adapted from Cnippet's Base UI toggle group; uses YaHala button tokens.
export function ToggleGroup({
  className,
  ...props
}: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      className={cn(
        'border-border bg-muted flex w-fit gap-1 rounded-2xl border p-1',
        className,
      )}
      {...props}
    />
  )
}

export function ToggleGroupItem(props: Toggle.Props) {
  return (
    <Toggle
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'data-pressed:bg-primary data-pressed:text-primary-foreground min-h-11 px-4',
      )}
      {...props}
    />
  )
}
