import { useEffect, useState } from 'react'
import { RatingDisplay } from './ui/rating'
import type { Testimonial } from '../lib/testimonials'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from './ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './ui/carousel'

// Based on the Cnippet testimonial example; only approved client quotes are displayed.
export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (!api) return
    const update = () => setSelected(api.selectedScrollSnap())
    update()
    api.on('select', update)
    return () => {
      api.off('select', update)
    }
  }, [api])
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/testimonials', { signal: controller.signal })
      .then(async (response) => {
        if (response.ok)
          setTestimonials((await response.json()).testimonials ?? [])
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  if (!testimonials.length) return null
  return (
    <section
      className="ui-section-block w-full"
      aria-labelledby="testimonials-title"
    >
      <div className="ui-section-header mb-6">
        <h2 id="testimonials-title" className="ui-section-title">
          In our clients’ words
        </h2>
      </div>
      <Carousel
        setApi={setApi}
        opts={{ loop: testimonials.length > 1, align: 'start' }}
        className="w-full"
        aria-label="Client testimonials"
      >
        <CarouselContent>
          {testimonials.map((testimonial) => (
            <CarouselItem
              key={testimonial.id}
              className="md:basis-1/2 lg:basis-1/3"
            >
              <Card className="h-full">
                <CardContent>
                  <RatingDisplay value={testimonial.rating} className="mb-4" />
                  <blockquote
                    className="ui-body wrap-anywhere whitespace-pre-wrap"
                    dir="auto"
                  >
                    “{testimonial.quote}”
                  </blockquote>
                </CardContent>
                <CardHeader className="mt-auto flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {testimonial.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => Array.from(part)[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 wrap-anywhere">
                    <CardTitle dir="auto">{testimonial.name}</CardTitle>
                    {testimonial.role && (
                      <CardDescription dir="auto">
                        {testimonial.role}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {testimonials.length > 1 && (
          <div className="mt-5 flex justify-end gap-3">
            <CarouselPrevious className="static min-h-11 min-w-11 translate-y-0" />
            <CarouselNext className="static min-h-11 min-w-11 translate-y-0" />
          </div>
        )}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          Testimonial {selected + 1} of {testimonials.length}
        </p>
      </Carousel>
    </section>
  )
}
