import { randomBytes } from 'crypto'
import { requireAuth } from '../../../../../lib/auth'
import { supabase } from '../../../../../lib/supabase'

export async function POST(req: Request) {
  const org = await requireAuth(req)
  const apiKey = `sia_${randomBytes(16).toString('hex')}`

  const { error } = await supabase
    .from('organizations')
    .update({ api_key: apiKey })
    .eq('id', org.id)

  if (error) {
    return Response.json({ error: 'Failed to rotate API key' }, { status: 500 })
  }

  return Response.json({
    api_key: apiKey,
    warning: 'Save this key now. It will not be shown again.'
  })
}
