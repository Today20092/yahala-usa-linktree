import type { CSSProperties, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SocialLinkButtonProps = {
  href: string
  label: string
  id?: string
  ariaLabel?: string
  style?: CSSProperties
  className?: string
  children?: ReactNode
}

export default function SocialLinkButton({
  href,
  label,
  id,
  ariaLabel,
  style,
  className,
  children,
}: SocialLinkButtonProps) {
  return (
    <Button
      asChild
      variant="outline"
      size="lg"
      className={cn(
        'brand-social-link elevation-2 hover:elevation-4 text-foreground focus-visible:ring-ring/30 focus-visible:ring-offset-background mx-auto h-14 w-full cursor-pointer rounded-full border border-solid px-5 text-base font-bold transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0',
        className,
      )}
    >
      <a
        href={href}
        id={id}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel ?? label}
        style={style}
      >
        <span className="flex w-full items-center">
          <span className="grid size-9 shrink-0 place-items-center">
            {children}
          </span>
          <span className="min-w-0 flex-1 pl-3 text-left leading-none font-medium whitespace-nowrap">
            {label}
          </span>
        </span>
      </a>
    </Button>
  )
}
