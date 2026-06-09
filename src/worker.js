const PRIMARY_HOST = 'yahalausa.net'
const REDIRECT_HOSTS = new Set([
  'www.yahalausa.net',
  'yahalausa.co',
  'www.yahalausa.co',
])

export default {
  fetch(request, env) {
    const url = new URL(request.url)

    if (REDIRECT_HOSTS.has(url.hostname)) {
      url.hostname = PRIMARY_HOST
      return Response.redirect(url.toString(), 301)
    }

    return env.ASSETS.fetch(request)
  },
}
