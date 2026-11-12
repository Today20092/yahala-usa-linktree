type BarListItem = {
  name: string
  value: number
  href: string
  imageSrc?: string
}

// Adapted from Cnippet Bar List (MIT); keep exact counts and touch-sized links.
export function BarList({
  data,
  label,
  valueLabel,
}: {
  data: BarListItem[]
  label: string
  valueLabel?: string
}) {
  const max = Math.max(...data.map((row) => row.value), 0)
  return (
    <ul aria-label={label} data-slot="bar-list" className="grid gap-2">
      {data.map((row) => (
        <li key={row.href}>
          <a
            href={row.href}
            className="text-foreground hover:text-primary focus-visible:ring-ring relative flex min-h-12 flex-col items-start justify-between gap-4 overflow-hidden rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none sm:flex-row sm:items-center"
          >
            <span
              aria-hidden="true"
              className="bg-primary/10 absolute inset-y-0 start-0 rounded-lg"
              style={{ width: `${max > 0 ? (row.value / max) * 100 : 0}%` }}
            />
            <span
              dir="auto"
              className="relative flex min-w-0 flex-1 items-center gap-3 font-semibold [overflow-wrap:anywhere]"
            >
              {row.imageSrc && (
                <img
                  src={row.imageSrc}
                  alt=""
                  width={32}
                  height={24}
                  loading="lazy"
                  className="h-6 w-8 shrink-0 object-contain"
                />
              )}
              <span className="min-w-0">{row.name}</span>{' '}
            </span>
            <span className="relative max-w-full min-w-0 [overflow-wrap:anywhere] tabular-nums">
              {row.value.toLocaleString('en-US')}{' '}
              <span className="text-inherit">
                {valueLabel ?? (row.value === 1 ? 'story' : 'stories')}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
