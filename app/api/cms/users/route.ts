import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { UserService } from '@/server/services/UserService'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Users', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const users = await UserService.getAllUsers()
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Users', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, email, password, phone, roleId } = body
    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ error: 'name, email, password, and roleId are required' }, { status: 400 })
    }

    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } })
    if (!role) {
      return NextResponse.json({ error: 'Invalid roleId' }, { status: 400 })
    }

    const newUser = await UserService.createUser({ name, email, password, phone, roleId: Number(roleId) })

    // Auto-populate permissions overrides based on the selected role
    const modulesToOverride = ['Amenities', 'Customers', 'Developers', 'Media', 'PaymentPlans', 'Projects', 'Units']
    
    if (role.name === 'Admin') {
      const allModules = [...modulesToOverride, 'Settings', 'Templates', 'Users', 'Pages']
      await prisma.userModuleAccess.createMany({
        data: allModules.map(moduleName => ({
          userId: newUser.id,
          moduleName,
          accessLevel: 'EDIT'
        }))
      })
    } else if (role.name === 'Sales' || role.name === 'Marketing') {
      await prisma.userModuleAccess.createMany({
        data: modulesToOverride.map(moduleName => ({
          userId: newUser.id,
          moduleName,
          accessLevel: 'EDIT'
        }))
      })
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
