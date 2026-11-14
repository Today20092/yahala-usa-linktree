import { verifyAccess } from './access.js'
import { json, readPayload } from './testimonials.js'

const ACTIONS = ['new', 'replied', 'archived', 'delete']

/** Access-protected list and status changes for saved contact form requests. */
export async function handleAdminRequests(request, env) {
  const url = new URL(request.url)
  const db = env.TESTIMONIALS_DB
  if (!db) return json({ error: 'unavailable' }, 503)
  const reviewer = await verifyAccess(request, env)
  if (!reviewer) return json({ error: 'unauthorized' }, 401)
  try {
    if (request.method === 'GET') {
      const { results } = await db
        .prepare(
          'SELECT id, interest, name, email, phone, business, location, message, status, created_at, updated_at, archived_at FROM partnership_requests ORDER BY created_at DESC LIMIT 500',
        )
        .all()
      return json({ requests: results, reviewer })
    }
    if (request.method !== 'POST') return json({ error: 'method' }, 405)
    if (request.headers.get('Origin') !== url.origin)
      return json({ error: 'forbidden' }, 403)
    const { id, action } = (await readPayload(request)) ?? {}
    if (
      typeof id !== 'string' ||
      !/^[a-f0-9-]{36}$/.test(id) ||
      !ACTIONS.includes(action)
    )
      return json({ error: 'invalid' }, 400)
    const result = await (
      action === 'delete'
        ? db.prepare('DELETE FROM partnership_requests WHERE id = ?').bind(id)
        : db
            .prepare(
              "UPDATE partnership_requests SET status = ?1, updated_at = CURRENT_TIMESTAMP, archived_at = CASE WHEN ?1 = 'archived' THEN CURRENT_TIMESTAMP END WHERE id = ?2",
            )
            .bind(action, id)
    ).run()
    if (result.meta.changes !== 1) return json({ error: 'missing' }, 404)
    console.log('request admin', action, id, reviewer)
    return json({ ok: true })
  } catch (error) {
    console.error('request admin failed', error?.code ?? 'unknown')
    return json({ error: 'failed' }, 502)
  }
}

/** Retention: archived requests are deleted 12 months after they were archived. */
export async function cleanupRequests(env) {
  try {
    await env.TESTIMONIALS_DB?.prepare(
      "DELETE FROM partnership_requests WHERE status = 'archived' AND archived_at < datetime('now', '-12 months')",
    ).run()
  } catch (error) {
    console.error('request cleanup failed', error?.code ?? 'unknown')
  }
}
