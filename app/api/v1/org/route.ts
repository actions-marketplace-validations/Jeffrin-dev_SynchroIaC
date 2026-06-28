import { requireAuth } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'

type OrgPatchBody = { name?: unknown }

function previewApiKey(apiKey: string) {
  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
}

async function parseJsonBody(req: Request) {
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { body: null, error: 'body is missing or invalid' }
    }

    return { body: parsed as OrgPatchBody, error: null }
  } catch {
    return { body: null, error: 'Invalid JSON body' }
  }
}

export async function GET(req: Request) {
  const org = await requireAuth(req)

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, plan, paddle_subscription_id, created_at, api_key')
    .eq('id', org.id)
    .single()

  if (orgError || !organization) {
    return Response.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }

  const { data: notificationConfigs, error: configsError } = await supabase
    .from('notification_configs')
    .select('*')
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  if (configsError) {
    return Response.json({ error: 'Failed to fetch notification configs' }, { status: 500 })
  }

  const { api_key: apiKey, paddle_subscription_id: _subscriptionId, ...safeOrg } = organization as Record<string, any>

  return Response.json({
    org: safeOrg,
    notification_configs: notificationConfigs ?? [],
    api_key_preview: previewApiKey(apiKey as string)
  })
}

export async function PATCH(req: Request) {
  const org = await requireAuth(req)
  const { body, error: bodyError } = await parseJsonBody(req)

  if (bodyError || !body) {
    return Response.json({ error: bodyError }, { status: 400 })
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return Response.json({ error: 'name must be a non-empty string' }, { status: 400 })
  }

  if (body.name.length > 100) {
    return Response.json({ error: 'name must be 100 characters or fewer' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('organizations')
    .update({ name: body.name.trim() })
    .eq('id', org.id)
    .select('id, name, plan, paddle_subscription_id, created_at')
    .single()

  if (error || !data) {
    return Response.json({ error: 'Failed to update organization' }, { status: 500 })
  }

  return Response.json({ org: data })
}
