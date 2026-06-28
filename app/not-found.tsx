import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">404 — Page not found</h1>
        <Link href="/dashboard/projects" className="mt-6 inline-block font-medium text-indigo-600 hover:text-indigo-700">
          Back to projects
        </Link>
      </div>
    </main>
  )
}
