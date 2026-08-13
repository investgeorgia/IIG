import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Amenities', AccessLevel.EDIT, true)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text content' }, { status: 400 })
    }

    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    let createdCount = 0
    for (const name of lines) {
      await prisma.amenity.upsert({
        where: { name },
        update: {},
        create: {
          name,
          category: 'OTHER'
        }
      })
      createdCount++
    }

    return NextResponse.json({ success: true, count: createdCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
