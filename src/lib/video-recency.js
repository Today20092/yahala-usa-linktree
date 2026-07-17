// Six weeks keeps the label useful between normal catalog refreshes.
export const RECENT_VIDEO_DAYS = 42

const publishedTime = (published) => {
  const time = Date.parse(published ?? '')
  return Number.isNaN(time) ? null : time
}

export const sortVideosByPublishedDate = (videos = []) =>
  videos
    .map((video, index) => ({
      video,
      index,
      time: publishedTime(video.published),
    }))
    .sort((a, b) => {
      if (a.time === null && b.time === null) return a.index - b.index
      if (a.time === null) return 1
      if (b.time === null) return -1
      return b.time - a.time || a.index - b.index
    })
    .map(({ video }) => video)

export const isRecentVideo = (published, now = new Date()) => {
  const time = publishedTime(published)
  if (time === null) return false

  const age = now.getTime() - time
  return age >= 0 && age <= RECENT_VIDEO_DAYS * 24 * 60 * 60 * 1000
}
