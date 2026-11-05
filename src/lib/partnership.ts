// Shared by the contact form (client) and the Worker route (server).
export const partnershipPath = '/api/partnership'

export const partnershipInterests = [
  'Sponsor a video',
  'Feature my business',
  'Share a story',
] as const

export const partnershipLimits = {
  name: 100,
  email: 254,
  business: 150,
  location: 100,
  message: 1200,
} as const

type Field = keyof typeof partnershipLimits
const required: Field[] = ['name', 'email', 'message']
const labels: Record<Field, string> = {
  name: 'Your name',
  email: 'Your email',
  business: 'Business / organization',
  location: 'City / state',
  message: 'Your idea',
}
// shortcut: pragmatic address check, not RFC 5322; the receiving server is the final judge.
const emailPattern =
  /^[^\s@<>()[\],;:"\\]+@[^\s@<>()[\],;:"\\]+\.[^\s@<>()[\],;:"\\]+$/

export type PartnershipInquiry = {
  interest: (typeof partnershipInterests)[number]
  name: string
  email: string
  business: string
  location: string
  message: string
}

export type PartnershipValidation =
  | { ok: true; value: PartnershipInquiry }
  | { ok: false; errors: Partial<Record<Field | 'interest', string>> }

// Validates untrusted input. Never trust client-side maxLength or `required`.
export function validatePartnership(input: unknown): PartnershipValidation {
  const source = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >
  const errors: Record<string, string> = {}
  const text = (key: string) => {
    const raw = source[key]
    // Strip control characters other than line breaks in the message.
    const clean = (typeof raw === 'string' ? raw : '')
      .replace(
        key === 'message'
          ? /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g
          : /[\u0000-\u001f\u007f]/g,
        '',
      )
      .trim()
    return clean
  }

  const interest = partnershipInterests.find((v) => v === source.interest)
  if (!interest) errors.interest = 'Choose what you would like to do.'

  const value = {
    interest,
    name: text('name'),
    email: text('email'),
    business: text('business'),
    location: text('location'),
    message: text('message'),
  }
  for (const key of Object.keys(partnershipLimits) as Field[]) {
    if (required.includes(key) && !value[key])
      errors[key] = `${labels[key]} is required.`
    else if (value[key].length > partnershipLimits[key])
      errors[key] =
        `${labels[key]} must be ${partnershipLimits[key]} characters or fewer.`
  }
  if (!errors.email && !emailPattern.test(value.email))
    errors.email = 'Enter an email address like name@example.com.'

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: value as PartnershipInquiry }
}

export const formatPartnershipBody = (v: PartnershipInquiry) =>
  [
    `I'm interested in: ${v.interest}`,
    `Name: ${v.name}`,
    `Reply email: ${v.email}`,
    `Business / organization: ${v.business || 'Not provided'}`,
    `City / state: ${v.location || 'Not provided'}`,
    '',
    v.message,
  ].join('\n')
