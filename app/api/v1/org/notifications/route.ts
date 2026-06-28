import { requireAuth } from '../../../../../lib/auth'
import { supabase } from '../../../../../lib/supabase'

const TYPES = new Set(['email', 'slack'])
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_CONFIGS = 5

type NotificationBody = { type?: unknown; config?: unknown }

async function parseJsonBody(req: Request) {
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { body: null, error: 'body is missing or invalid' }
    return { body: parsed as NotificationBody, error: null }
  } catch {
    return { body: null, error: 'Invalid JSON body' }
  }
}

function validateConfig(type: string, config: unknown) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return 'config is required'
  const value = config as Record<string, unknown>

  if (type === 'email') {
    return typeof value.email === 'string' && EMAIL_REGEX.test(value.email) ? null : 'config.email must be a valid email address'
  }

  if (type === 'slack') {
    return typeof value.webhook_url === 'string' && value.webhook_url.startsWith('https://hooks.slack.com/')
      ? null
      : 'config.webhook_url must start with https://hooks.slack.com/'
  }

  return 'type must be email or slack'
}

export async function GET(req: Request) {
  const org = await requireAuth(req)
  const { data, error } = await supabase
    .from('notification_configs')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: 'Failed to fetch notification configs' }, { status: 500 })
  return Response.json({ notification_configs: data ?? [] })
}

export async function POST(req: Request) {
  const org = await requireAuth(req)
  const { body, error: bodyError } = await parseJsonBody(req)
  if (bodyError || !body) return Response.json({ error: bodyError }, { status: 400 })

  if (typeof body.type !== 'string' || !TYPES.has(body.type)) {
    return Response.json({ error: 'type must be email or slack' }, { status: 400 })
  }

  const configError = validateConfig(body.type, body.config)
  if (configError) return Response.json({ error: configError }, { status: 400 })

  const { count, error: countError } = await supabase
    .from('notification_configs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.id)

  if (countError) return Response.json({ error: 'Failed to enforce notification config limit' }, { status: 500 })
  if ((count ?? 0) >= MAX_CONFIGS) return Response.json({ error: 'Maximum 5 notification configs per org' }, { status: 400 })

  const { data, error } = await supabase
    .from('notification_configs')
    .insert({ org_id: org.id, type: body.type, config: body.config, enabled: true })
    .select('*')
    .single()

  if (error || !data) return Response.json({ error: 'Failed to create notification config' }, { status: 500 })
  return Response.json(data, { status: 201 })
}
