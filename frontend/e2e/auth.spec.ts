import { expect, test, type Page } from '@playwright/test'

const API_URL = 'http://localhost:3333/api/v1'
const PASSWORD = 'secret123'

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function signupViaUi(page: Page, email: string, fullName = '') {
  await page.goto('/signup')
  if (fullName) await page.getByLabel('Nombre (opcional)').fill(fullName)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Repite la contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test.describe('FLOW-1: autenticación en el frontend', () => {
  test('el perfil sin sesión redirige a /login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('registro: crea la cuenta y entra al perfil', async ({ page }) => {
    const email = uniqueEmail()
    await signupViaUi(page, email, 'Ada Lovelace')

    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByText(email)).toBeVisible()
    await expect(page.getByText('Ada Lovelace')).toBeVisible()
  })

  test('registro: un email ya registrado muestra un mensaje claro', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail()
    const res = await request.post(`${API_URL}/auth/signup`, {
      data: { fullName: null, email, password: PASSWORD, passwordConfirmation: PASSWORD },
    })
    expect(res.ok()).toBeTruthy()

    await signupViaUi(page, email)

    await expect(page.getByRole('alert')).toHaveText(
      'Ya existe una cuenta con este email.',
    )
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('login: credenciales inválidas muestran un mensaje claro', async ({
    page,
  }) => {
    await loginViaUi(page, uniqueEmail(), 'wrongpass')

    await expect(page.getByRole('alert')).toHaveText(
      'Email o contraseña incorrectos.',
    )
    await expect(page).toHaveURL(/\/login$/)
  })

  test('login: guarda el token, muestra el perfil y lo mantiene al recargar', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail()
    await request.post(`${API_URL}/auth/signup`, {
      data: { fullName: null, email, password: PASSWORD, passwordConfirmation: PASSWORD },
    })

    const profileResponse = page.waitForResponse(
      (r) => r.url().endsWith('/account/profile') && r.ok(),
    )
    await loginViaUi(page, email, PASSWORD)
    await profileResponse

    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByText(email)).toBeVisible()
    const token = await page.evaluate(() => localStorage.getItem('flowsync.token'))
    expect(token).toMatch(/^oat_/)

    await page.reload()
    await expect(page.getByText(email)).toBeVisible()
  })

  test('logout: invalida el token y vuelve a /login', async ({ page, request }) => {
    const email = uniqueEmail()
    await signupViaUi(page, email)
    await expect(page.getByText(email)).toBeVisible()
    const token = await page.evaluate(() => localStorage.getItem('flowsync.token'))

    await page.getByRole('button', { name: 'Cerrar sesión' }).click()

    await expect(page).toHaveURL(/\/login$/)
    const res = await request.get(`${API_URL}/account/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status()).toBe(401)
  })

  test('navegación entre login y registro', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Regístrate' }).click()
    await expect(page).toHaveURL(/\/signup$/)

    await page.getByRole('link', { name: 'Inicia sesión' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
