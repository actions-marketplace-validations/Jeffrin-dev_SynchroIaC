import { ok, serverError } from '../../../lib/api-response'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  // 1. INSERT a new row into heartbeat
  const { data, error: insertError } = await supabase
    .from('heartbeat')
    .insert({})
    .select('id')
    .single()

  if (insertError) {
    return serverError(insertError.message)
  }

  // 2. If the insert succeeds, immediately DELETE that same row by id
  const { error: deleteError } = await supabase
    .from('heartbeat')
    .delete()
    .eq('id', data.id)

  if (deleteError) {
    // 4. If delete fails: log a warning but still return 200
    console.warn('Heartbeat cleanup failed:', deleteError.message)
  }

  // 5. On full success return the same shape as before
  return ok({ ok: true, timestamp: new Date().toISOString() })
}
