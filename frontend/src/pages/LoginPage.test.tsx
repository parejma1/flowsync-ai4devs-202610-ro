import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  TOKEN_KEY,
  TYPED_EMAIL,
  currentPath,
  deferred,
  jsonResponse,
  mockFetch,
  renderApp,
  requestBody,
  requestHeaders,
  user,
} from '@/test/utils'

async function fillAndSubmit(email: string, password: string) {
  const u = userEvent.setup()
  await u.type(screen.getByLabelText('Email'), email)
  await u.type(screen.getByLabelText('Contraseña'), password)
  await u.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage (FLOW-1)', () => {
  it('llama a POST /auth/login, guarda el token y lo usa para cargar el perfil', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ data: { user, token: 'oat_login' } }),
      jsonResponse({ data: user }),
    )
    renderApp('/login')

    await fillAndSubmit(`  ${TYPED_EMAIL} `, 'secret123')

    // Se muestra el email que devuelve /account/profile, no el tecleado.
    expect(await screen.findByText(user.email)).toBeInTheDocument()
    expect(currentPath()).toBe('/profile')

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/login$/)
    expect(requestBody(fetchMock)).toEqual({
      email: TYPED_EMAIL,
      password: 'secret123',
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('oat_login')

    expect(fetchMock.mock.calls[1][0]).toMatch(/\/account\/profile$/)
    expect(requestHeaders(fetchMock, 1)).toMatchObject({
      Authorization: 'Bearer oat_login',
    })
  })

  it('muestra un mensaje claro si las credenciales son inválidas', async () => {
    mockFetch(
      jsonResponse({ errors: [{ message: 'Invalid user credentials' }] }, 400),
    )
    renderApp('/login')

    await fillAndSubmit(TYPED_EMAIL, 'wrongpass')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email o contraseña incorrectos.',
    )
    expect(currentPath()).toBe('/login')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('muestra un mensaje claro si no hay conexión con el servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )
    renderApp('/login')

    await fillAndSubmit(TYPED_EMAIL, 'secret123')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor.',
    )
    expect(currentPath()).toBe('/login')
  })

  it('deshabilita el botón mientras se envía para evitar el doble envío', async () => {
    const pending = deferred<Response>()
    const fetchMock = vi.fn<typeof fetch>().mockReturnValueOnce(pending.promise)
    vi.stubGlobal('fetch', fetchMock)
    renderApp('/login')

    await fillAndSubmit(TYPED_EMAIL, 'secret123')

    const button = screen.getByRole('button', { name: 'Entrando…' })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    pending.resolve(
      jsonResponse({ errors: [{ message: 'Invalid user credentials' }] }, 400),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled(),
    )
  })

  it('enlaza con la pantalla de registro', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('link', { name: 'Regístrate' }))

    expect(currentPath()).toBe('/signup')
    expect(
      await screen.findByRole('button', { name: 'Crear cuenta' }),
    ).toBeInTheDocument()
  })
})
