import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/auth-context'
import { AuthLayout } from '@/components/AuthLayout'
import { FormErrors } from '@/components/FormErrors'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError } from '@/lib/api'
import { getProfile, logout, type User } from '@/lib/auth-api'
import { toErrorMessages } from '@/lib/error-messages'

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' })

export function ProfilePage() {
  const { token, clearToken } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!token) return
    let ignore = false

    getProfile(token)
      .then((profile) => {
        if (!ignore) setUser(profile)
      })
      .catch((error: unknown) => {
        if (ignore) return
        // Token caducado o revocado: RequireAuth redirige a /login.
        if (error instanceof ApiError && error.status === 401) clearToken()
        else setErrors(toErrorMessages(error))
      })

    return () => {
      ignore = true
    }
  }, [token, clearToken])

  async function handleLogout() {
    if (!token) return
    setLoggingOut(true)
    // Aunque falle la llamada, la sesión local se cierra igualmente.
    await logout(token).catch(() => undefined)
    clearToken()
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta de FlowSync.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FormErrors messages={errors} />
          {user ? (
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground"
              >
                {user.initials}
              </div>
              <dl className="grid gap-1 text-sm">
                <div>
                  <dt className="sr-only">Nombre</dt>
                  <dd className="font-medium">
                    {user.fullName ?? 'Sin nombre'}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd className="text-muted-foreground">{user.email}</dd>
                </div>
                <div>
                  <dt className="sr-only">Fecha de alta</dt>
                  <dd className="text-muted-foreground">
                    Miembro desde{' '}
                    {dateFormatter.format(new Date(user.createdAt))}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            errors.length === 0 && (
              <p className="text-sm text-muted-foreground">Cargando perfil…</p>
            )
          )}
        </CardContent>
        <CardFooter className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
