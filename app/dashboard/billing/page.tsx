import Link from 'next/link'

export default function BillingPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
      <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600 shadow-sm">Paddle billing integration coming soon.</p>
      <Link href="/dashboard/settings" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Back to settings</Link>
    </section>
  )
}
