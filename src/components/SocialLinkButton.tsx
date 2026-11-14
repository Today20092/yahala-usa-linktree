import type { CSSProperties, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SocialLinkButtonProps = {
  href: string
  label: string
  description?: string
  id?: string
  ariaLabel?: string
  style?: CSSProperties
  className?: string
  children?: ReactNode
}

export default function SocialLinkButton({
  href,
  label,
  description,
  id,
  ariaLabel,
  style,
  className,
  children,
}: SocialLinkButtonProps) {
  return (
    <Button
      nativeButton={false}
      role="link"
      render={
        <a
          href={href}
          id={id}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${ariaLabel ?? label}${description ? ` ${description}` : ''} (opens in a new tab)`}
          style={style}
        />
      }
      variant="outline"
      size="lg"
      className={cn(
        'brand-social-link elevation-2 hover:elevation-4 text-foreground focus-visible:ring-ring/30 focus-visible:ring-offset-background group mx-auto h-auto min-h-16 w-full cursor-pointer rounded-2xl border border-solid px-5 text-base font-bold transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0',
        className,
      )}
    >
      <span className="flex w-full items-center">
        <span className="social-icon-tile text-scrim-foreground grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-5">
          {children}
        </span>
        <span className="min-w-0 flex-1 pl-3 text-left leading-none font-medium whitespace-nowrap">
          <span className="block">{label} </span>
          {description && (
            <span className="text-muted-foreground mt-1 block text-xs leading-snug font-normal whitespace-normal">
              {description}
            </span>
          )}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
        >
          <path d="M7 17 17 7M7 7h10v10" />
        </svg>
      </span>
    </Button>
  )
}
