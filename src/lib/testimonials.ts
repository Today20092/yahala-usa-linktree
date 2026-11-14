export type Testimonial = {
  id: string
  name: string
  role: string
  quote: string
  rating: number
}

export type TestimonialStatus = 'pending' | 'approved' | 'rejected'

/** A row from the Access-protected admin API. D1 timestamps are UTC `YYYY-MM-DD HH:MM:SS`. */
export type AdminTestimonial = Testimonial & {
  status: TestimonialStatus
  consent_at: string
  reviewed_at: string | null
  review_expires: number
}
