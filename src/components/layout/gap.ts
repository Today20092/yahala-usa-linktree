// Literal class names so Tailwind can see them; keys follow the Tailwind spacing scale.
export const gaps = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
  12: 'gap-12',
} as const

export type Gap = keyof typeof gaps
