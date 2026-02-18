// In production (Render), set VITE_API_URL to the backend service URL.
// In local Docker dev, leave unset — nginx proxies /api/ to the backend.
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

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

// Token storage for browsers that block cross-origin cookies (e.g. mobile Safari)
let sessionToken: string | null = null

function setToken(token: string | null) {
  sessionToken = token
  if (token) {
    try { sessionStorage.setItem('session_token', token) } catch { /* ignore */ }
  } else {
    try { sessionStorage.removeItem('session_token') } catch { /* ignore */ }
  }
}

function getToken(): string | null {
  if (sessionToken) return sessionToken
  try { return sessionStorage.getItem('session_token') } catch { return null }
}

function clearToken() {
  sessionToken = null
  try { sessionStorage.removeItem('session_token') } catch { /* ignore */ }
}

async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { json, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  }

  // Attach Bearer token if available (works on mobile Safari where cookies are blocked)
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
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
      clearToken()
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

export { ApiError, setToken, clearToken }
