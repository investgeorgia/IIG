import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { UserService } from '@/server/services/UserService'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    await UserService.updatePassword(user.id, newPassword)

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error: any) {
    const { safeErrorMessage } = require('@/server/utils/errors')
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
