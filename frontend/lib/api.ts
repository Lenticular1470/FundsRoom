export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000'
}

const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}/api${normalizedPath}`
}

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const errorMessage = payload?.message || response.statusText || 'Unexpected API error'
    throw new Error(errorMessage)
  }
  return payload.data as T
}

export const apiGet = async <T>(path: string, token?: string): Promise<T> => {
  const response = await fetch(getApiUrl(path), {
    method: 'GET',
    headers: buildHeaders(token),
  })
  return parseResponse<T>(response)
}

export const apiPost = async <T>(path: string, body: unknown, token?: string): Promise<T> => {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })
  return parseResponse<T>(response)
}

export const apiPut = async <T>(path: string, body: unknown, token?: string): Promise<T> => {
  const response = await fetch(getApiUrl(path), {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  })
  return parseResponse<T>(response)
}

export const apiDelete = async <T>(path: string, token?: string): Promise<T> => {
  const response = await fetch(getApiUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(token),
  })
  return parseResponse<T>(response)
}
