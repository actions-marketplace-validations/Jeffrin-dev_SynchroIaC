'use client'

import Link from 'next/link'

type ErrorPageProps = {
  error: Error
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        {process.env.NODE_ENV === 'development' ? (
          <pre className="mt-4 overflow-auto rounded-lg bg-gray-100 p-4 text-left font-mono text-sm text-gray-600">
            {error.message}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
        >
          Try again
        </button>
        <div className="mt-4">
          <Link href="/dashboard" className="font-medium text-indigo-600 hover:text-indigo-700">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
