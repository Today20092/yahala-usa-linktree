import * as React from 'react'

import { cn } from '@/lib/utils'

type IconBadgeTone = 'solid' | 'soft' | 'neutral' | 'inverse'
type IconBadgeShape = 'circle' | 'square' | 'pill'
type IconBadgeSize = 'xs' | 'sm' | 'md' | 'lg'
type IconBadgeStyle = React.CSSProperties & Record<string, string>

type IconBadgeProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'style'> & {
  tone?: IconBadgeTone
  shape?: IconBadgeShape
  size?: IconBadgeSize
  style?: IconBadgeStyle
}

const sizeClasses: Record<IconBadgeSize, string> = {
  xs: 'size-5',
  sm: 'size-6',
  md: 'size-8',
  lg: 'size-10',
}

function IconBadge({
  className,
  tone = 'solid',
  shape = 'circle',
  size = 'md',
  children,
  ...props
}: IconBadgeProps) {
  return (
    <span
      data-slot="icon-badge"
      data-tone={tone}
      data-shape={shape}
      data-size={size}
      className={cn('ui-icon-badge', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}

export { IconBadge }
