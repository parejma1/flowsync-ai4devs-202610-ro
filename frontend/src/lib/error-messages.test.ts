import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api'
import { toErrorMessages } from '@/lib/error-messages'

describe('toErrorMessages', () => {
  it('traduce las credenciales inválidas (400)', () => {
    const error = new ApiError(400, [{ message: 'Invalid user credentials' }])
    expect(toErrorMessages(error)).toEqual(['Email o contraseña incorrectos.'])
  })

  it('traduce el email ya registrado (422 database.unique)', () => {
    const error = new ApiError(422, [
      {
        message: 'The email has already been taken',
        rule: 'database.unique',
        field: 'email',
      },
    ])
    expect(toErrorMessages(error)).toEqual([
      'Ya existe una cuenta con este email.',
    ])
  })

  it('traduce cada error de validación y elimina duplicados', () => {
    const error = new ApiError(422, [
      { message: '', rule: 'email', field: 'email' },
      { message: '', rule: 'minLength', field: 'password' },
      { message: '', rule: 'sameAs', field: 'passwordConfirmation' },
      { message: '', rule: 'sameAs', field: 'passwordConfirmation' },
    ])
    expect(toErrorMessages(error)).toEqual([
      'El email no tiene un formato válido.',
      'La contraseña debe tener al menos 8 caracteres.',
      'Las contraseñas no coinciden.',
    ])
  })

  it('concuerda en género con el campo', () => {
    const error = new ApiError(422, [
      { message: '', rule: 'required', field: 'password' },
      { message: '', rule: 'required', field: 'email' },
      { message: '', rule: 'regex', field: 'passwordConfirmation' },
      { message: '', rule: 'regex', field: 'desconocido' },
    ])
    expect(toErrorMessages(error)).toEqual([
      'La contraseña es obligatoria.',
      'El email es obligatorio.',
      'La confirmación de contraseña no es válida.',
      'Un campo no es válido.',
    ])
  })

  it('avisa de los errores de red', () => {
    expect(toErrorMessages(new ApiError(0, []))).toEqual([
      'No se pudo conectar con el servidor. Inténtalo de nuevo.',
    ])
  })

  it.each([new ApiError(500, []), new ApiError(422, []), new Error('boom')])(
    'usa un mensaje genérico para %s',
    (error) => {
      expect(toErrorMessages(error)).toEqual([
        'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
      ])
    },
  )
})
