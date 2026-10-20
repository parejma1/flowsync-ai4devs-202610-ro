import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  TOKEN_KEY,
  jsonResponse,
  mockFetch,
  renderApp,
  requestBody,
  user,
} from '@/test/utils'

async function fillAndSubmit(email: string, password: string) {
  const u = userEvent.setup()
  await u.type(screen.getByLabelText('Email'), email)
  await u.type(screen.getByLabelText('Contraseña'), password)
  await u.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage (FLOW-1)', () => {
  it('llama a POST /auth/login, guarda el token y redirige al perfil', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ data: { user, token: 'oat_login' } }),
      jsonResponse({ data: user }),
    )
    renderApp('/login')

    await fillAndSubmit('  ada@example.com ', 'secret123')

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/login$/)
    expect(requestBody(fetchMock)).toEqual({
      email: 'ada@example.com',
      password: 'secret123',
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('oat_login')
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/account\/profile$/)
  })

  it('muestra un mensaje claro si las credenciales son inválidas', async () => {
    mockFetch(
      jsonResponse({ errors: [{ message: 'Invalid user credentials' }] }, 400),
    )
    renderApp('/login')

    await fillAndSubmit('ada@example.com', 'wrongpass')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email o contraseña incorrectos.',
    )
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('enlaza con la pantalla de registro', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('link', { name: 'Regístrate' }))
    expect(
      screen.getByText('Crear cuenta', { selector: '[data-slot=card-title]' }),
    ).toBeInTheDocument()
  })
})
