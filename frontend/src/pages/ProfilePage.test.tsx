import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  TOKEN_KEY,
  currentPath,
  jsonResponse,
  mockFetch,
  renderApp,
  requestHeaders,
  user,
} from '@/test/utils'

describe('ProfilePage y rutas protegidas (FLOW-1)', () => {
  it('redirige a /login si no hay sesión', async () => {
    const fetchMock = mockFetch()
    renderApp('/profile')

    expect(
      await screen.findByRole('button', { name: 'Entrar' }),
    ).toBeInTheDocument()
    expect(currentPath()).toBe('/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('consume GET /account/profile con el token guardado', async () => {
    localStorage.setItem(TOKEN_KEY, 'oat_saved')
    const fetchMock = mockFetch(jsonResponse({ data: user }))
    renderApp('/profile')

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText(user.email)).toBeInTheDocument()
    expect(screen.getByText('AL')).toBeInTheDocument()
    expect(currentPath()).toBe('/profile')

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/account\/profile$/)
    expect(requestHeaders(fetchMock)).toMatchObject({
      Authorization: 'Bearer oat_saved',
    })
  })

  it('cierra la sesión y vuelve a /login si el token ya no es válido (401)', async () => {
    localStorage.setItem(TOKEN_KEY, 'oat_expired')
    mockFetch(
      jsonResponse({ errors: [{ message: 'Unauthorized access' }] }, 401),
    )
    renderApp('/profile')

    expect(
      await screen.findByRole('button', { name: 'Entrar' }),
    ).toBeInTheDocument()
    expect(currentPath()).toBe('/login')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it.each([
    [
      'un error del servidor (500)',
      () => mockFetch(new Response('', { status: 500 })),
    ],
    [
      'un fallo de red',
      () =>
        vi.stubGlobal(
          'fetch',
          vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
        ),
    ],
  ])(
    'ante %s muestra el error y conserva la sesión',
    async (_case, setupFetch) => {
      localStorage.setItem(TOKEN_KEY, 'oat_saved')
      setupFetch()
      renderApp('/profile')

      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.queryByText('Cargando perfil…')).not.toBeInTheDocument()
      expect(currentPath()).toBe('/profile')
      expect(localStorage.getItem(TOKEN_KEY)).toBe('oat_saved')
    },
  )

  it('cierra sesión con POST /account/logout', async () => {
    localStorage.setItem(TOKEN_KEY, 'oat_saved')
    const fetchMock = mockFetch(
      jsonResponse({ data: user }),
      jsonResponse({ message: 'Logged out successfully' }),
    )
    renderApp('/profile')

    await screen.findByText('Ada Lovelace')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(
      await screen.findByRole('button', { name: 'Entrar' }),
    ).toBeInTheDocument()
    expect(currentPath()).toBe('/login')
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/account\/logout$/)
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST')
    expect(requestHeaders(fetchMock, 1)).toMatchObject({
      Authorization: 'Bearer oat_saved',
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('redirige al perfil si ya hay sesión y se visita /login', async () => {
    localStorage.setItem(TOKEN_KEY, 'oat_saved')
    mockFetch(jsonResponse({ data: user }))
    renderApp('/login')

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(currentPath()).toBe('/profile')
  })
})
