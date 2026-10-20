import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthProvider'

export const TOKEN_KEY = 'flowsync.token'

export const user = {
  id: 1,
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2026-10-20T17:08:09.851+00:00',
  updatedAt: '2026-10-20T17:08:09.851+00:00',
  initials: 'AL',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Sustituye `fetch` por un mock que devuelve las respuestas en orden. */
export function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const response of responses) fetchMock.mockResolvedValueOnce(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Cuerpo JSON enviado en la llamada `n` a fetch. */
export function requestBody(fetchMock: ReturnType<typeof mockFetch>, n = 0) {
  return JSON.parse(String(fetchMock.mock.calls[n][1]?.body))
}

export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}
