import { useState, type FormEvent } from 'react'
import {
  ArrowUpRightIcon,
  Clock3Icon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  VideoSearchCopy,
  VideoSearchResponse,
  VideoSearchResult,
} from '@/lib/video-search'

type Props = {
  copy: VideoSearchCopy
}

const formatTimestamp = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remaining = safeSeconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

const isRtl = (value: string) => /[\u0600-\u06ff]/.test(value)

function ResultCard({
  result,
  copy,
}: {
  result: VideoSearchResult
  copy: VideoSearchCopy
}) {
  return (
    <Card size="sm" className="text-left">
      <CardHeader>
        <div className="flex items-start gap-3">
          <img
            src={result.thumbnail}
            alt=""
            className="aspect-video w-28 shrink-0 rounded-lg object-cover sm:w-36"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2">{result.title}</CardTitle>
            <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Clock3Icon data-icon="inline-start" />
                {formatTimestamp(result.startSeconds)}
              </Badge>
              {result.language && (
                <Badge variant="outline">{result.language.toUpperCase()}</Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p
          dir={isRtl(result.excerpt) ? 'rtl' : 'ltr'}
          className="text-muted-foreground line-clamp-4 text-sm leading-relaxed"
        >
          {result.excerpt}
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild size="sm">
          <a href={result.url} target="_blank" rel="noreferrer">
            {copy.watchLabel}
            <ArrowUpRightIcon data-icon="inline-end" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function VideoSearch({ copy }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VideoSearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  )

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) return

    setStatus('loading')
    try {
      const params = new URLSearchParams({
        q: normalizedQuery,
        limit: String(copy.resultLimit),
      })
      const response = await fetch(`/api/video-search?${params}`)
      if (!response.ok) throw new Error('Search request failed')
      const payload = (await response.json()) as VideoSearchResponse
      setResults(payload.results)
      setStatus('done')
    } catch {
      setResults([])
      setStatus('error')
    }
  }

  return (
    <section
      className="animate-fade-in-up mx-auto mt-8 w-full max-w-xl px-4 text-left delay-300 sm:px-6"
      aria-labelledby="video-search-title"
    >
      <Card>
        <CardHeader>
          <Badge variant="secondary">
            <SparklesIcon data-icon="inline-start" />
            {copy.eyebrow}
          </Badge>
          <CardTitle id="video-search-title" className="text-xl">
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex gap-2" role="search">
            <label htmlFor="video-search-query" className="sr-only">
              {copy.title}
            </label>
            <Input
              id="video-search-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.placeholder}
              minLength={2}
              maxLength={200}
              dir="auto"
              autoComplete="off"
            />
            <Button type="submit" size="lg" disabled={status === 'loading'}>
              <SearchIcon data-icon="inline-start" />
              <span className="hidden sm:inline">{copy.buttonLabel}</span>
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-3" aria-live="polite">
            {status === 'loading' && (
              <>
                <span className="sr-only">{copy.loadingLabel}</span>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border p-3">
                    <Skeleton className="aspect-video w-28 shrink-0" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {status === 'done' && results.length === 0 && (
              <Empty>
                <EmptyTitle>{copy.emptyLabel}</EmptyTitle>
                <EmptyDescription>{copy.description}</EmptyDescription>
              </Empty>
            )}

            {status === 'error' && (
              <Empty>
                <EmptyTitle>{copy.errorLabel}</EmptyTitle>
              </Empty>
            )}

            {status === 'done' && results.length > 0 && (
              <>
                <p className="text-muted-foreground text-sm">
                  {results.length} {copy.resultLabel}
                </p>
                {results.map((result) => (
                  <ResultCard
                    key={`${result.videoId}:${result.startSeconds}`}
                    result={result}
                    copy={copy}
                  />
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
