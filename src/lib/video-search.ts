export type VideoSearchCopy = {
  eyebrow: string
  title: string
  description: string
  placeholder: string
  buttonLabel: string
  exampleQueries: string[]
  loadingLabel: string
  emptyLabel: string
  emptyDescription: string
  errorLabel: string
  errorDescription: string
  watchLabel: string
  resultLabel: string
  resultLimit: number
}

export type VideoSearchResult = {
  videoId: string
  title: string
  thumbnail: string
  excerpt: string
  language: string
  score: number
  startSeconds: number
  endSeconds: number
  duration: string
  published: string
  url: string
}

export type VideoSearchResponse = {
  query: string
  results: VideoSearchResult[]
}
