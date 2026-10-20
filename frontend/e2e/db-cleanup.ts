import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

/** Dominio reservado para los usuarios que crean los e2e. */
export const E2E_EMAIL_DOMAIN = 'e2e.flowsync.test'

const BACKEND_DIR = path.resolve(import.meta.dirname, '../../backend')
const DB_PATH = path.join(BACKEND_DIR, 'tmp/db.sqlite3')

type Database = {
  prepare(sql: string): { run(...params: unknown[]): { changes: number } }
  close(): void
}

/**
 * Borra de la BD de desarrollo del backend los usuarios creados por los e2e
 * (y sus tokens). Se ejecuta antes (restos de ejecuciones abortadas) y
 * después de la suite, así que solo toca emails `@e2e.flowsync.test`.
 */
export default function cleanupE2eUsers() {
  if (!existsSync(DB_PATH)) return

  // better-sqlite3 es dependencia del backend; se carga desde allí.
  const require = createRequire(path.join(BACKEND_DIR, 'package.json'))
  const Sqlite = require('better-sqlite3') as new (file: string) => Database
  const db = new Sqlite(DB_PATH)
  try {
    const pattern = `%@${E2E_EMAIL_DOMAIN}`
    db.prepare(
      'DELETE FROM auth_access_tokens WHERE tokenable_id IN (SELECT id FROM users WHERE email LIKE ?)',
    ).run(pattern)
    db.prepare('DELETE FROM users WHERE email LIKE ?').run(pattern)
  } finally {
    db.close()
  }
}
