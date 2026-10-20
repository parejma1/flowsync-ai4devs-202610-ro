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

async function fillAndSubmit({
  fullName = '',
  email = 'ada@example.com',
  password = 'secret123',
  confirmation = password,
}: {
  fullName?: string
  email?: string
  password?: string
  confirmation?: string
} = {}) {
  const u = userEvent.setup()
  if (fullName)
    await u.type(screen.getByLabelText('Nombre (opcional)'), fullName)
  await u.type(screen.getByLabelText('Email'), email)
  await u.type(screen.getByLabelText('Contraseña'), password)
  await u.type(screen.getByLabelText('Repite la contraseña'), confirmation)
  await u.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

describe('SignupPage (FLOW-1)', () => {
  it('llama a POST /auth/signup con lo que exige la API y entra al perfil', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ data: { user, token: 'oat_signup' } }),
      jsonResponse({ data: user }),
    )
    renderApp('/signup')

    await fillAndSubmit()

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/signup$/)
    // fullName es obligatorio como clave aunque vaya vacío.
    expect(requestBody(fetchMock)).toEqual({
      fullName: null,
      email: 'ada@example.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('oat_signup')
  })

  it('envía el nombre si se rellena', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ data: { user, token: 'oat_signup' } }),
      jsonResponse({ data: user }),
    )
    renderApp('/signup')

    await fillAndSubmit({ fullName: ' Ada Lovelace ' })

    await screen.findByText('ada@example.com')
    expect(requestBody(fetchMock).fullName).toBe('Ada Lovelace')
  })

  it('muestra un mensaje claro si el email ya está registrado', async () => {
    mockFetch(
      jsonResponse(
        {
          errors: [
            {
              message: 'The email has already been taken',
              rule: 'database.unique',
              field: 'email',
            },
          ],
        },
        422,
      ),
    )
    renderApp('/signup')

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una cuenta con este email.',
    )
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('no llama a la API si las contraseñas no coinciden', async () => {
    const fetchMock = mockFetch()
    renderApp('/signup')

    await fillAndSubmit({ password: 'secret123', confirmation: 'secret124' })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Las contraseñas no coinciden.',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('enlaza con la pantalla de login', async () => {
    renderApp('/signup')
    await userEvent.click(screen.getByRole('link', { name: 'Inicia sesión' }))
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})
