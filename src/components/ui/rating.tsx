'use client'

import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { StarIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

const ratingStarVariants = cva('shrink-0', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: 'size-5',
      lg: 'size-7',
      sm: 'size-4',
    },
  },
})

// Adapted from Cnippet Rating to use Ya Hala tokens and bilingual labels.
const FILLED = 'fill-primary text-primary'
const EMPTY = 'fill-transparent text-muted-foreground'

export function Rating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  max = 5,
  size,
  className,
  disabled,
  readOnly,
  ...props
}: Omit<
  RadioGroupPrimitive.Props<number>,
  'value' | 'defaultValue' | 'onValueChange'
> &
  VariantProps<typeof ratingStarVariants> & {
    /** Selected rating from 1 to `max`; 0 means none yet. */
    value?: number
    defaultValue?: number
    onValueChange?: (value: number) => void
    max?: number
  }): React.ReactElement {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [hovered, setHovered] = React.useState<number | null>(null)
  const value = valueProp ?? internalValue
  const shown = hovered ?? value
  const interactive = !disabled && !readOnly

  return (
    <RadioGroupPrimitive<number>
      className={cn(
        'inline-flex items-center gap-0.5 data-disabled:opacity-64',
        className,
      )}
      data-slot="rating"
      disabled={disabled}
      onPointerLeave={() => setHovered(null)}
      onValueChange={(next) => {
        if (valueProp === undefined) setInternalValue(next)
        onValueChange?.(next)
      }}
      readOnly={readOnly}
      value={value}
      {...props}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1
        return (
          <RadioPrimitive.Root
            aria-label={`${star} out of ${max} stars / ${star} من ${max}`}
            className={cn(
              'focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-1 motion-safe:transition-transform',
              interactive && 'cursor-pointer motion-safe:hover:scale-110',
            )}
            data-slot="rating-item"
            key={star}
            onPointerEnter={() => interactive && setHovered(star)}
            value={star}
          >
            <StarIcon
              aria-hidden="true"
              className={cn(
                ratingStarVariants({ size }),
                'transition-colors',
                star <= shown ? FILLED : EMPTY,
              )}
            />
          </RadioPrimitive.Root>
        )
      })}
    </RadioGroupPrimitive>
  )
}

/** Read-only display that can show fractions, e.g. an average of 4.6. */
export function RatingDisplay({
  value,
  max = 5,
  size,
  className,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof ratingStarVariants> & {
    value: number
    max?: number
  }): React.ReactElement {
  return (
    <div
      aria-label={`${value} out of ${max} stars`}
      className={cn('inline-flex items-center gap-0.5', className)}
      data-slot="rating-display"
      role="img"
      {...props}
    >
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.min(Math.max(value - i, 0), 1)
        return (
          <span className="relative inline-flex" key={String(i)}>
            <StarIcon
              aria-hidden="true"
              className={cn(ratingStarVariants({ size }), EMPTY)}
            />
            {fill > 0 && (
              <span
                className="absolute inset-y-0 start-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarIcon
                  aria-hidden="true"
                  className={cn(ratingStarVariants({ size }), FILLED)}
                />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
