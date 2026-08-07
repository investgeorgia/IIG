import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { UserService } from '@/server/services/UserService'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Users', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const { name, email, phone, roleId } = await request.json()
    if (!name || !email || !roleId) {
      return NextResponse.json({ error: 'name, email, and roleId are required' }, { status: 400 })
    }

    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } })
    if (!role) {
      return NextResponse.json({ error: 'Invalid roleId' }, { status: 400 })
    }

    const currentUserRecord = await prisma.user.findUnique({ where: { id } })
    const roleChanged = currentUserRecord?.roleId !== Number(roleId)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        roleId: Number(roleId)
      },
      select: { id: true, name: true, email: true, phone: true, isActive: true, roleId: true }
    })

    if (roleChanged) {
      await prisma.userModuleAccess.deleteMany({ where: { userId: id } })
      const modulesToOverride = ['Amenities', 'Customers', 'Developers', 'Media', 'PaymentPlans', 'Projects', 'Units']
      
      if (role.name === 'Admin') {
        const allModules = [...modulesToOverride, 'Settings', 'Templates', 'Users', 'Pages']
        await prisma.userModuleAccess.createMany({
          data: allModules.map(moduleName => ({
            userId: id,
            moduleName,
            accessLevel: 'EDIT'
          }))
        })
      } else if (role.name === 'Sales' || role.name === 'Marketing') {
        await prisma.userModuleAccess.createMany({
          data: modulesToOverride.map(moduleName => ({
            userId: id,
            moduleName,
            accessLevel: 'EDIT'
          }))
        })
      }
    }

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Users', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const { isActive } = await request.json()
    const updatedUser = await UserService.toggleActive(id, Boolean(isActive))
    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Users', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    await UserService.deleteUser(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
