const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

export type ApiErrorDetail = {
  message: string
  field?: string
  rule?: string
}

/**
 * Error devuelto por la API (status >= 400) o por la red (status 0).
 * `errors` sigue el formato de AdonisJS/VineJS: `{ errors: [{ message, field?, rule? }] }`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly errors: ApiErrorDetail[]

  constructor(status: number, errors: ApiErrorDetail[]) {
    super(errors[0]?.message ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

type ApiFetchOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

/**
 * Llama a la API y devuelve el contenido de `data` de la respuesta.
 * Lanza `ApiError` si la respuesta no es 2xx o si falla la red.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, token }: ApiFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, [])
  }

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const errors =
      payload &&
      typeof payload === 'object' &&
      'errors' in payload &&
      Array.isArray(payload.errors)
        ? (payload.errors as ApiErrorDetail[])
        : []
    throw new ApiError(response.status, errors)
  }

  return (payload as { data: T } | null)?.data as T
}
