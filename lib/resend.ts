import { env } from './env'
export type DriftAlertInput = {
  orgName: string
  recipientEmail: string
  projectName: string
  scanId: string
  totalDrifts: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  dashboardUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildCountCell(count: number, color?: string): string {
  const style = color && count > 0 ? `color: ${color}; font-weight: 700;` : 'color: #111827;'
  return `<td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; text-align: right; ${style}">${count}</td>`
}

function buildEmailHtml(input: DriftAlertInput): string {
  const orgName = escapeHtml(input.orgName)
  const projectName = escapeHtml(input.projectName)
  const scanId = escapeHtml(input.scanId)
  const dashboardUrl = escapeHtml(input.dashboardUrl)

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 24px; line-height: 1.25; margin: 0 0 16px; color: #111827;">Infrastructure Drift Detected</h1>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Organization:</strong> ${orgName}</p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Project:</strong> ${projectName}</p>
      <p style="margin: 0 0 20px; color: #6B7280;"><strong>Scan ID:</strong> ${scanId}</p>

      <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px; border: 1px solid #E5E7EB;">
        <tbody>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #374151;">Critical</td>
            ${buildCountCell(input.criticalCount, '#DC2626')}
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #374151;">High</td>
            ${buildCountCell(input.highCount, '#EA580C')}
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #374151;">Medium</td>
            ${buildCountCell(input.mediumCount)}
          </tr>
          <tr>
            <td style="padding: 10px 12px; color: #374151;">Low</td>
            <td style="padding: 10px 12px; text-align: right; color: #111827;">${input.lowCount}</td>
          </tr>
        </tbody>
      </table>

      <p style="margin: 0 0 24px; color: #374151;"><strong>Total drifts:</strong> ${input.totalDrifts}</p>

      <a href="${dashboardUrl}" style="display: inline-block; background: #4F46E5; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 700;">View Drift Report</a>

      <p style="margin: 32px 0 0; color: #6B7280; font-size: 13px;">You are receiving this because drift alerts are enabled for ${orgName}. Powered by SynchroIaC.</p>
    </div>
  `
}

export async function sendDriftAlert(input: DriftAlertInput): Promise<void> {
  try {
    const apiKey = env.RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY is not set; skipping drift alert email')
      return
    }

    const subjectSeverity = input.criticalCount > 0 ? 'CRITICAL' : 'HIGH'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SynchroIaC <alerts@synchroiac.com>',
        to: [input.recipientEmail],
        subject: `[SynchroIaC] ${subjectSeverity} drift detected in ${input.projectName}`,
        html: buildEmailHtml(input)
      })
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error('Failed to send drift alert email', response.status, errorBody)
    }
  } catch (error) {
    console.error('Failed to send drift alert email', error)
  }
}
