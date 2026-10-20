import { apiFetch } from '@/lib/api'

/** Forma fijada por `backend/app/transformers/user_transformer.ts`. */
export type User = {
  id: number
  fullName: string | null
  email: string
  createdAt: string
  updatedAt: string | null
  initials: string
}

type AuthResponse = { user: User; token: string }

export type SignupInput = {
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export function signup(input: SignupInput) {
  return apiFetch<AuthResponse>('/auth/signup', { method: 'POST', body: input })
}

export function login(input: { email: string; password: string }) {
  return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: input })
}

export function getProfile(token: string) {
  return apiFetch<User>('/account/profile', { token })
}

export function logout(token: string) {
  return apiFetch<unknown>('/account/logout', { method: 'POST', token })
}
