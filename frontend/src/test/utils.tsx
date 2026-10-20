import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import App from '@/App'
import { AuthProvider } from '@/auth/AuthProvider'
import { LocationDisplay } from '@/test/LocationDisplay'

export const TOKEN_KEY = 'flowsync.token'

/** Email que se teclea en los formularios. */
export const TYPED_EMAIL = 'ada@example.com'

/**
 * Usuario que devuelve la API. Su email es distinto del tecleado para que los
 * tests distingan "muestra lo que devuelve /account/profile" de "muestra lo
 * que escribió el usuario".
 */
export const user = {
  id: 1,
  fullName: 'Ada Lovelace',
  email: 'ada.perfil@example.com',
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

/** Promesa que el test resuelve a mano, para observar estados intermedios. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

/** Cuerpo JSON enviado en la llamada `n` a fetch. */
export function requestBody(fetchMock: ReturnType<typeof mockFetch>, n = 0) {
  return JSON.parse(String(fetchMock.mock.calls[n][1]?.body))
}

/** Cabeceras enviadas en la llamada `n` a fetch. */
export function requestHeaders(fetchMock: ReturnType<typeof mockFetch>, n = 0) {
  return fetchMock.mock.calls[n][1]?.headers
}

/** Ruta actual del MemoryRouter de `renderApp`. */
export function currentPath() {
  return screen.getByTestId('location').textContent
}

export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
      <LocationDisplay />
    </MemoryRouter>,
  )
}
