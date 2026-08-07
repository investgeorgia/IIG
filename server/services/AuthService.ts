import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { UserRepository } from '../repositories/UserRepository'
import { SessionRepository } from '../repositories/SessionRepository'

const jwtSecretRaw = process.env.JWT_SECRET
if (!jwtSecretRaw) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"')
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw)

export class AuthService {
  static async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Generate JWT
    const token = await new SignJWT({ sub: user.id.toString(), role: user.roleId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(JWT_SECRET)

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    await SessionRepository.create({
      token,
      expiresAt,
      user: { connect: { id: user.id } }
    })

    // Clean up expired sessions asynchronously
    SessionRepository.deleteExpired().catch(() => {})

    return { token, user }
  }

  static async verifyToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return payload
    } catch (e) {
      return null
    }
  }

  static async logout(token: string) {
    await SessionRepository.deleteByToken(token)
  }
}
