import { ApiError } from '@/lib/api'

const NETWORK_ERROR = 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
const UNEXPECTED_ERROR = 'Ha ocurrido un error inesperado. Inténtalo de nuevo.'

// `feminine` decide la concordancia de los adjetivos ("obligatorio/a").
const FIELD_LABELS: Record<string, { label: string; feminine: boolean }> = {
  fullName: { label: 'El nombre', feminine: false },
  email: { label: 'El email', feminine: false },
  password: { label: 'La contraseña', feminine: true },
  passwordConfirmation: {
    label: 'La confirmación de contraseña',
    feminine: true,
  },
}
const UNKNOWN_FIELD = { label: 'Un campo', feminine: false }

function validationMessage(
  field: string | undefined,
  rule: string | undefined,
) {
  if (field === 'email' && rule === 'database.unique') {
    return 'Ya existe una cuenta con este email.'
  }
  if (field === 'passwordConfirmation' && rule === 'sameAs') {
    return 'Las contraseñas no coinciden.'
  }

  const { label, feminine } = (field && FIELD_LABELS[field]) || UNKNOWN_FIELD
  const o = feminine ? 'a' : 'o'
  switch (rule) {
    case 'required':
      return `${label} es obligatori${o}.`
    case 'email':
      return `${label} no tiene un formato válido.`
    case 'minLength':
      return `${label} debe tener al menos 8 caracteres.`
    case 'maxLength':
      return `${label} supera la longitud máxima.`
    default:
      return `${label} no es válid${o}.`
  }
}

/** Traduce un error de la API a mensajes legibles para el usuario. */
export function toErrorMessages(error: unknown): string[] {
  if (!(error instanceof ApiError)) return [UNEXPECTED_ERROR]

  switch (error.status) {
    case 0:
      return [NETWORK_ERROR]
    case 400:
      return ['Email o contraseña incorrectos.']
    case 422: {
      const messages = error.errors.map((e) =>
        validationMessage(e.field, e.rule),
      )
      return messages.length > 0 ? [...new Set(messages)] : [UNEXPECTED_ERROR]
    }
    default:
      return [UNEXPECTED_ERROR]
  }
}
