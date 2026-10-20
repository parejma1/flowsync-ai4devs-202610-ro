import { describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from '@/lib/api'
import { jsonResponse, mockFetch } from '@/test/utils'

describe('apiFetch', () => {
  it('desenvuelve `data` de la respuesta', async () => {
    mockFetch(jsonResponse({ data: { ok: true } }))
    await expect(apiFetch('/x')).resolves.toEqual({ ok: true })
  })

  it('envía el token como Bearer y el cuerpo como JSON', async () => {
    const fetchMock = mockFetch(jsonResponse({ data: null }))
    await apiFetch('/x', { method: 'POST', body: { a: 1 }, token: 'oat_abc' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3333/api/v1/x')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"a":1}')
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer oat_abc',
      'Content-Type': 'application/json',
    })
  })

  it('lanza ApiError con status y errores de la API', async () => {
    const errors = [
      { message: 'taken', rule: 'database.unique', field: 'email' },
    ]
    mockFetch(jsonResponse({ errors }, 422))

    const error = await apiFetch('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, errors })
  })

  it('lanza ApiError con status 0 si falla la red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    )
    await expect(apiFetch('/x')).rejects.toMatchObject({
      status: 0,
      errors: [],
    })
  })

  it('tolera respuestas de error sin cuerpo JSON', async () => {
    mockFetch(new Response('Internal error', { status: 500 }))
    await expect(apiFetch('/x')).rejects.toMatchObject({
      status: 500,
      errors: [],
    })
  })
})
