import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from '@/auth/auth-context'

const STORAGE_KEY = 'flowsync.token'

// localStorage puede no estar disponible (modo privado, cookies bloqueadas):
// en ese caso la sesión vive solo en memoria.
function readStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignorado: ver readStoredToken.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState(readStoredToken)

  const setToken = useCallback((value: string) => {
    writeStoredToken(value)
    setTokenState(value)
  }, [])

  const clearToken = useCallback(() => {
    writeStoredToken(null)
    setTokenState(null)
  }, [])

  const value = useMemo(
    () => ({ token, setToken, clearToken }),
    [token, setToken, clearToken],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
