import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

type ThemePreference = 'system' | 'light' | 'dark'

declare global {
  interface Window {
    // Defined by the inline boot script in BrandedPageDocument, the single source of truth.
    yahalaTheme?: {
      read: () => ThemePreference
      set: (preference: ThemePreference) => void
    }
  }
}

// Cnippet's v-toggle-group-8 icon theme selector, retaining our theme controller.
const options = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export default function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference | null>(null)

  useEffect(() => {
    const sync = () => setPreference(window.yahalaTheme?.read() ?? 'system')
    sync()
    document.documentElement.addEventListener('themechange', sync)
    return () =>
      document.documentElement.removeEventListener('themechange', sync)
  }, [])

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      <span id="theme-toggle-label" className="sr-only">
        Theme
      </span>
      <ToggleGroup
        aria-labelledby="theme-toggle-label"
        className="text-muted-foreground [&_button[data-pressed]]:border-input [&_button[data-pressed]]:bg-background [&_button[data-pressed]]:text-foreground rounded-xl [&_button]:size-11 [&_button]:rounded-lg [&_button]:p-0"
        value={preference ? [preference] : []}
        onValueChange={(values) => {
          const next = values[0] as ThemePreference | undefined
          if (next) window.yahalaTheme?.set(next)
        }}
      >
        {options.map(({ value, label, icon: Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            title={`${label} theme`}
          >
            <Icon className="size-4" aria-hidden="true" />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
