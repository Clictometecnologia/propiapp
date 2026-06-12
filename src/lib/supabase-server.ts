import { cookies } from 'next/headers'
import { verifyToken } from './auth'

export async function requireAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    throw new Error('No autorizado. Debes iniciar sesión.')
  }

  const payload = await verifyToken(token)
  if (!payload) {
    throw new Error('No autorizado. Debes iniciar sesión.')
  }

  return payload
}
