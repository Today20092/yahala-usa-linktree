import type { AdminTestimonial } from './testimonials'

// Loaded only by `astro dev`, which does not run the Worker or D1. Production builds drop this module.
const day = 86400000
const stamp = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * day)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')

export const sampleTestimonials: AdminTestimonial[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Maya Haddad',
    role: 'Owner, Cedar Bakery',
    quote:
      'Ya Hala captured our family story with so much care. Customers still mention the video when they come in.',
    rating: 5,
    status: 'pending',
    consent_at: stamp(1),
    reviewed_at: null,
    review_expires: Date.now() + 13 * day,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'سامي العلي',
    role: 'مطعم الياسمين',
    quote:
      'تجربة رائعة من البداية إلى النهاية. الفريق محترف وودود، والفيديو عرّف مجتمعنا بمطعمنا بطريقة جميلة.',
    rating: 4,
    status: 'pending',
    consent_at: stamp(20),
    reviewed_at: null,
    review_expires: Date.now() - 6 * day,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Omar Khalil',
    role: 'Community organizer, Dearborn',
    quote:
      'We worked with Ya Hala on a series about small businesses along Warren Avenue. From the first call they listened closely to what mattered to each owner, and they never rushed anyone in front of the camera. The finished episodes felt honest and warm, and several of the shops told us they saw new customers the very next weekend. The team also shared clips we could post ourselves, which made it easy to keep the momentum going. I would recommend them to any organization that wants its community to be seen the way it sees itself.',
    rating: 5,
    status: 'approved',
    consent_at: stamp(30),
    reviewed_at: stamp(28),
    review_expires: Date.now() - 16 * day,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Lina Saleh',
    role: '',
    quote: 'Professional, kind and fast. Thank you for sharing our story!',
    rating: 5,
    status: 'approved',
    consent_at: stamp(45),
    reviewed_at: stamp(44),
    review_expires: Date.now() - 31 * day,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Test Submission',
    role: 'QA',
    quote: 'Checking that the testimonial form sends an email correctly.',
    rating: 3,
    status: 'rejected',
    consent_at: stamp(60),
    reviewed_at: stamp(60),
    review_expires: Date.now() - 46 * day,
  },
]
