import { badGateway, created, notFound, ok, paymentRequired, tooManyRequests } from '../../../../../../lib/api-response'
import { requireAuth } from '../../../../../../lib/auth'
import { createDriftFixPR, type CreatePRInput } from '../../../../../../lib/github'
import { checkRateLimit } from '../../../../../../lib/ratelimit'
import { supabase } from '../../../../../../lib/supabase'

const DRIFT_SELECT = `
  id,
  scan_id,
  resource_type,
  resource_id,
  attribute,
  desired_value,
  actual_value,
  risk_level,
  explanation,
  pr_url,
  scans!inner(
    project_id,
    projects!inner(org_id, repo_url)
  )
`

type RouteContext = {
  params: {
    id: string
  }
}

type DriftRecord = {
  id: string
  scan_id: string
  resource_type: string | null
  resource_id: string | null
  attribute: string | null
  desired_value: unknown
  actual_value: unknown
  risk_level: string | null
  explanation: string | null
  pr_url: string | null
  repo_url: string | null
}

function stringifyDriftValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function flattenDrift(row: Record<string, any>): DriftRecord {
  const scan = Array.isArray(row.scans) ? row.scans[0] : row.scans
  const project = Array.isArray(scan?.projects) ? scan.projects[0] : scan?.projects
  const { scans, ...drift } = row
  void scans

  return {
    ...(drift as Omit<DriftRecord, 'repo_url'>),
    repo_url: project?.repo_url ?? null
  }
}

async function fetchDriftForOrg(id: string, orgId: string): Promise<DriftRecord | null> {
  const { data, error } = await supabase
    .from('drifts')
    .select(DRIFT_SELECT)
    .eq('id', id)
    .eq('scans.projects.org_id', orgId)
    .maybeSingle()

  if (error || !data) return null
  return flattenDrift(data as Record<string, any>)
}

function buildCreatePRInput(drift: DriftRecord): CreatePRInput {
  return {
    repoUrl: drift.repo_url ?? '',
    driftId: drift.id,
    resourceType: drift.resource_type ?? '',
    resourceId: drift.resource_id ?? '',
    attribute: drift.attribute ?? '',
    desiredValue: stringifyDriftValue(drift.desired_value),
    actualValue: stringifyDriftValue(drift.actual_value),
    riskLevel: drift.risk_level ?? '',
    explanation: drift.explanation ?? ''
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  const org = await requireAuth(req)
  const rateLimit = checkRateLimit(`pr:${org.id}`, 10, 60_000)
  if (!rateLimit.allowed) {
    return tooManyRequests(rateLimit.resetAt - Date.now())
  }

  const drift = await fetchDriftForOrg(params.id, org.id)

  if (!drift) {
    return notFound('Drift not found')
  }

  if (!drift.repo_url?.trim()) {
    return badGateway('No repository URL configured for this project', 'Set repo_url on the project before generating fix PRs')
  }

  const existingPrUrl = drift.pr_url?.trim()
  if (existingPrUrl) {
    return ok({ pr_url: existingPrUrl, cached: true })
  }

  if (org.plan === 'free') {
    return paymentRequired('PR generation requires a pro or team plan', '/dashboard/billing')
  }

  let prUrl: string
  try {
    prUrl = await createDriftFixPR(buildCreatePRInput(drift))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return badGateway('Failed to create GitHub PR', message)
  }

  const { error: updateError } = await supabase.from('drifts').update({ pr_url: prUrl }).eq('id', drift.id)
  if (updateError) {
    console.error('Failed to store drift PR URL', updateError)
  }

  return created({ pr_url: prUrl, cached: false })
}
