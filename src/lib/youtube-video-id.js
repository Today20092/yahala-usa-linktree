const youtubeVideoIdPattern = /^[a-zA-Z0-9_-]{11}$/

export const getYoutubeVideoId = (urlOrId = '') => {
  const value = String(urlOrId).trim()
  if (youtubeVideoIdPattern.test(value)) return value

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')
    let candidate = ''

    if (host === 'youtu.be') {
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? ''
    } else if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      candidate = url.searchParams.get('v') ?? ''
      if (!candidate) {
        const parts = url.pathname.split('/').filter(Boolean)
        const index = parts.findIndex((part) =>
          ['embed', 'shorts', 'live'].includes(part),
        )
        candidate = index >= 0 ? (parts[index + 1] ?? '') : ''
      }
    }

    return youtubeVideoIdPattern.test(candidate) ? candidate : ''
  } catch {
    return ''
  }
}
