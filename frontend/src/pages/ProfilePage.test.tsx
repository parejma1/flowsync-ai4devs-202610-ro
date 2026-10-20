import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  TOKEN_KEY,
  jsonResponse,
  mockFetch,
  renderApp,
  user,
} from '@/test/utils'

describe('ProfilePage y rutas protegidas (FLOW-1)', () => {
  it('redirige a /login si no hay sesión', () => {
    const fetchMock = mockFetch()
    renderApp('/profile')

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('consume GET /account/profile con el token guardado', async () => {
    localStorage.setItem(TOKEN_KEY, 'oat_saved')
    const fetchMock = mockFetch(jsonResponse({ data: user }))
    renderApp('/profile')

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText('AL')).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/account\/profile$/)
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer oat_saved' })
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
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

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
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/account\/logout$/)
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('redirige al perfil si ya hay sesión y se visita /login', async () => {
    localStorage.setItem(TOKEN_KEY, 'oat_saved')
    mockFetch(jsonResponse({ data: user }))
    renderApp('/login')

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
  })
})
