import { useEffect, useState } from 'react'

interface HealthStatus {
  status: string
  version: string
  environment: string
  service: string
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError('Backend not reachable. Start it with: uvicorn app.main:app --reload'))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Webflow SEO Alt Text Tool
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Generate and apply SEO-friendly alt text for your CMS images
              </p>
            </div>
            {health && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                API {health.status}
              </span>
            )}
            {error && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                API offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <h3 className="text-sm font-medium text-red-800">
              Cannot connect to backend
            </h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        ) : !health ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Connecting to API...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                System Status
              </h2>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-gray-500">Service</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.service}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Version</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.version}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Environment</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {health.environment}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="text-sm font-medium text-green-600">
                    {health.status}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Placeholder for Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                CMS Items
              </h2>
              <p className="text-sm text-gray-500">
                Items from your Webflow collection will appear here once the
                items endpoint is connected.
              </p>
              <div className="mt-4 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                <p className="text-gray-400">No items loaded yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  Phase 2 will connect this to GET /api/v1/items
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
