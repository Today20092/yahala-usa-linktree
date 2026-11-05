import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useId, useRef } from 'react'

import { Button } from './button'

type Option = { value: string; label: string }

// Cnippet's Base UI combobox pattern, reduced to our single-selection filters.
export function SearchableSelect({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
}: {
  label: string
  options: Option[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}) {
  const id = useId()
  const anchor = useRef<HTMLDivElement>(null)
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-foreground text-sm font-semibold">
        {label}
      </label>
      <Combobox.Root
        items={options}
        value={options.find((option) => option.value === value) ?? null}
        onValueChange={(option) => onValueChange(option?.value ?? '')}
        disabled={disabled}
      >
        <Combobox.InputGroup
          ref={anchor}
          className="border-input bg-background focus-within:border-ring focus-within:ring-ring/30 mt-2 flex min-h-12 rounded-lg border focus-within:ring-2 data-disabled:opacity-50"
        >
          <Combobox.Input
            id={id}
            placeholder="Type to search…"
            className="text-foreground min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
          />
          <Combobox.Trigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 rounded-lg"
              />
            }
            aria-label={`Show ${label.toLowerCase()} options`}
          >
            <ChevronsUpDown className="size-4" aria-hidden="true" />
          </Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner
            anchor={anchor}
            sideOffset={6}
            align="start"
            className="z-50 max-w-[calc(100vw-2rem)]"
          >
            <Combobox.Popup className="border-border bg-popover text-popover-foreground max-h-[min(var(--available-height),20rem)] w-[var(--anchor-width)] overflow-y-auto rounded-lg border p-1 shadow-md">
              <Combobox.Empty className="text-muted-foreground p-3 text-sm empty:p-0">
                No matching locations.
              </Combobox.Empty>
              <Combobox.List>
                {(option: Option) => (
                  <Combobox.Item
                    key={option.value}
                    value={option}
                    className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex min-h-11 cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm outline-none"
                  >
                    <span className="size-4 shrink-0">
                      <Combobox.ItemIndicator>
                        <Check className="size-4" aria-hidden="true" />
                      </Combobox.ItemIndicator>
                    </span>
                    <span>{option.label}</span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  )
}
