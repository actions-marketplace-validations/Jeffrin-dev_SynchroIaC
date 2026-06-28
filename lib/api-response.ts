export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

export function created(data: unknown): Response {
  return Response.json(data, { status: 201 })
}

export function badRequest(error: string): Response {
  return Response.json({ error }, { status: 400 })
}

export function unauthorized(error = 'Unauthorized'): Response {
  return Response.json({ error }, { status: 401 })
}

export function forbidden(error = 'Forbidden'): Response {
  return Response.json({ error }, { status: 403 })
}

export function notFound(error = 'Not found'): Response {
  return Response.json({ error }, { status: 404 })
}

export function paymentRequired(error: string, upgradeUrl: string): Response {
  return Response.json({ error, upgrade_url: upgradeUrl }, { status: 402 })
}

export function tooManyRequests(retryAfterMs: number): Response {
  return Response.json(
    { error: 'Rate limit exceeded', retry_after_ms: retryAfterMs },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000))
      }
    }
  )
}

export function serverError(error = 'Internal server error'): Response {
  return Response.json({ error }, { status: 500 })
}

export function badGateway(error: string, detail: string): Response {
  return Response.json({ error, detail }, { status: 502 })
}
