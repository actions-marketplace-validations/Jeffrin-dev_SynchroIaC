import { ok, serverError } from '../../../lib/api-response'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { error } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)

  if (error) {
    return serverError(error.message)
  }

  return ok({ ok: true, timestamp: new Date().toISOString() })
}
