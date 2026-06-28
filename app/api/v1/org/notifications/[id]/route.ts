import { requireAuth } from '../../../../../../lib/auth'
import { supabase } from '../../../../../../lib/supabase'

type Params = { params: { id: string } }
type PatchBody = { enabled?: unknown }

async function fetchConfig(id: string, orgId: string) {
  const { data, error } = await supabase
    .from('notification_configs')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !data) return null
  return data
}

async function parseJsonBody(req: Request) {
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { body: null, error: 'body is missing or invalid' }
    return { body: parsed as PatchBody, error: null }
  } catch {
    return { body: null, error: 'Invalid JSON body' }
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const org = await requireAuth(req)
  const existing = await fetchConfig(params.id, org.id)
  if (!existing) return Response.json({ error: 'Notification config not found' }, { status: 404 })

  const { body, error: bodyError } = await parseJsonBody(req)
  if (bodyError || !body) return Response.json({ error: bodyError }, { status: 400 })
  if (typeof body.enabled !== 'boolean') return Response.json({ error: 'enabled must be a boolean' }, { status: 400 })

  const { data, error } = await supabase
    .from('notification_configs')
    .update({ enabled: body.enabled })
    .eq('id', params.id)
    .eq('org_id', org.id)
    .select('*')
    .single()

  if (error || !data) return Response.json({ error: 'Failed to update notification config' }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(req: Request, { params }: Params) {
  const org = await requireAuth(req)
  const existing = await fetchConfig(params.id, org.id)
  if (!existing) return Response.json({ error: 'Notification config not found' }, { status: 404 })

  const { error } = await supabase
    .from('notification_configs')
    .delete()
    .eq('id', params.id)
    .eq('org_id', org.id)

  if (error) return Response.json({ error: 'Failed to delete notification config' }, { status: 500 })
  return Response.json({ deleted: true })
}
