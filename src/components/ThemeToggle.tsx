import { useEffect, useState } from 'react'
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

const options: [ThemePreference, string][] = [
  ['system', 'System'],
  ['light', 'Light'],
  ['dark', 'Dark'],
]

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
      <span id="theme-toggle-label">Theme</span>
      <ToggleGroup
        aria-labelledby="theme-toggle-label"
        value={preference ? [preference] : []}
        onValueChange={(values) => {
          const next = values[0] as ThemePreference | undefined
          if (next) window.yahalaTheme?.set(next)
        }}
      >
        {options.map(([value, label]) => (
          <ToggleGroupItem key={value} value={value}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
