import { cookies } from 'next/headers'
import { AuthService } from '../services/AuthService'
import { UserRepository } from '../repositories/UserRepository'
import { SessionRepository } from '../repositories/SessionRepository'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) return null

  const payload = await AuthService.verifyToken(token)
  if (!payload || !payload.sub) return null

  // Verify the token still exists in the session table and hasn't expired
  const session = await SessionRepository.findByToken(token)
  if (!session || session.expiresAt < new Date()) return null

  const user = await UserRepository.findById(Number(payload.sub))
  return user
}
