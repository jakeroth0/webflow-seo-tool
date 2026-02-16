const BASE_URL = ''

interface FetchOptions extends RequestInit {
  json?: unknown
}

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  }

  let body = rest.body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...rest,
    headers,
    body,
    credentials: 'include',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    const err = new ApiError(res.status, text)

    // Broadcast 401 so AuthContext can clear state
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    throw err
  }

  return res.json()
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, json?: unknown) => request<T>(url, { method: 'POST', json }),
  put: <T>(url: string, json?: unknown) => request<T>(url, { method: 'PUT', json }),
  patch: <T>(url: string, json?: unknown) => request<T>(url, { method: 'PATCH', json }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}

export { ApiError }
