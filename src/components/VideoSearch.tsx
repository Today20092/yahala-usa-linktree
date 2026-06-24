import { useState, type FormEvent } from 'react'
import {
  ArrowUpRightIcon,
  Clock3Icon,
  LoaderCircleIcon,
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
import { youtubeThumbnailFallbackUrl, getYoutubeVideoId } from '@/lib/youtube-videos'

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
  const videoId = getYoutubeVideoId(result.url)
  const thumbnailFallback = videoId
    ? youtubeThumbnailFallbackUrl(videoId)
    : ''

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
            data-fallback-src={thumbnailFallback}
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
  const [lastQuery, setLastQuery] = useState('')
  const [results, setResults] = useState<VideoSearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  )

  const runSearch = async (searchQuery: string) => {
    const normalizedQuery = searchQuery.trim()
    if (normalizedQuery.length < 2) return

    setLastQuery(normalizedQuery)
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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runSearch(query)
  }

  const searchExample = (exampleQuery: string) => {
    setQuery(exampleQuery)
    void runSearch(exampleQuery)
  }

  return (
    <section
      className="animate-fade-in-up mx-auto mt-8 w-full max-w-xl px-4 text-left delay-300 sm:px-6"
      aria-labelledby="video-search-title"
    >
      <Card className="gap-5 py-5 shadow-xs">
        <CardHeader className="gap-2 px-5 sm:px-6">
          <Badge
            variant="secondary"
            className="bg-secondary/70 w-fit text-xs font-medium"
          >
            <SparklesIcon data-icon="inline-start" />
            {copy.eyebrow}
          </Badge>
          <CardTitle
            id="video-search-title"
            className="max-w-md text-2xl leading-tight font-semibold tracking-normal"
          >
            {copy.title}
          </CardTitle>
          <CardDescription className="max-w-prose text-sm leading-relaxed sm:text-base">
            {copy.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6">
          <form
            onSubmit={submit}
            className="flex flex-col gap-2 sm:flex-row"
            role="search"
          >
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
              className="h-11 rounded-2xl px-4 text-[0.95rem] shadow-sm sm:h-10"
            />
            <Button
              type="submit"
              size="lg"
              disabled={status === 'loading'}
              className="h-11 gap-2 rounded-2xl px-4 sm:h-10"
            >
              {status === 'loading' ? (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SearchIcon data-icon="inline-start" />
              )}
              <span>
                {status === 'loading' ? 'Searching' : copy.buttonLabel}
              </span>
            </Button>
          </form>

          {copy.exampleQueries.length > 0 && status === 'idle' && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {copy.exampleQueries.map((exampleQuery) => (
                <Button
                  key={exampleQuery}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-muted text-muted-foreground hover:text-foreground rounded-full px-3"
                  onClick={() => searchExample(exampleQuery)}
                >
                  {exampleQuery}
                </Button>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3" aria-live="polite">
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
                <EmptyTitle>
                  {copy.emptyLabel}
                  {lastQuery ? ` for "${lastQuery}"` : ''}
                </EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </Empty>
            )}

            {status === 'error' && (
              <Empty>
                <EmptyTitle>{copy.errorLabel}</EmptyTitle>
                <EmptyDescription>{copy.errorDescription}</EmptyDescription>
              </Empty>
            )}

            {status === 'done' && results.length > 0 && (
              <>
                <p className="text-muted-foreground text-sm">
                  {results.length} {copy.resultLabel}
                  {lastQuery ? ` for "${lastQuery}"` : ''}
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
