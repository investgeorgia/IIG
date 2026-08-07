import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const UNIT_TYPE_MAP: Record<string, string> = {
  'STUDIO': 'STUDIO',
  '1 BHK': 'APARTMENT',
  'ONE BHK': 'APARTMENT',
  '1BHK': 'APARTMENT',
  'ONE_BHK': 'APARTMENT',
  '2 BHK': 'APARTMENT',
  'TWO BHK': 'APARTMENT',
  '2BHK': 'APARTMENT',
  'TWO_BHK': 'APARTMENT',
  '3 BHK': 'APARTMENT',
  'THREE BHK': 'APARTMENT',
  '3BHK': 'APARTMENT',
  'THREE_BHK': 'APARTMENT',
  '4 BHK': 'APARTMENT',
  'FOUR BHK': 'APARTMENT',
  '4BHK': 'APARTMENT',
  'FOUR_BHK': 'APARTMENT',
  'APARTMENT': 'APARTMENT',
  'VILLA': 'VILLA',
  'TOWNHOUSE': 'TOWNHOUSE',
  'PENTHOUSE': 'PENTHOUSE',
  'PLOT': 'PLOT',
  'COMMERCIAL': 'COMMERCIAL'
}

const UNIT_STATUS_MAP: Record<string, string> = {
  'AVAILABLE': 'AVAILABLE',
  'RESERVED': 'RESERVED',
  'SOLD': 'SOLD'
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const projectId = Number((await params).id)
    const { rows, mapping } = await request.json()

    if (!Array.isArray(rows) || !mapping) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
    }

    let createdCount = 0
    let updatedCount = 0

    for (const row of rows) {
      // Find unit number based on mapped column header
      const unitNumberHeader = mapping['unitNumber']
      const unitNumber = unitNumberHeader ? String(row[unitNumberHeader] || '').trim() : ''

      if (!unitNumber) continue

      // Map other fields
      const typeHeader = mapping['type']
      const rawType = typeHeader ? String(row[typeHeader] || '').trim() : ''
      const type = rawType || 'APARTMENT'

      const bedroomsHeader = mapping['bedrooms']
      const bedrooms = bedroomsHeader ? Math.max(0, parseInt(row[bedroomsHeader], 10) || 0) : 0

      const bathroomsHeader = mapping['bathrooms']
      const bathrooms = bathroomsHeader ? Math.max(0, parseInt(row[bathroomsHeader], 10) || 0) : 0

      const sizeHeader = mapping['size']
      const size = sizeHeader ? Math.max(0, parseFloat(row[sizeHeader]) || 0) : 0

      const priceHeader = mapping['price']
      const price = priceHeader ? Math.max(0, parseFloat(row[priceHeader]) || 0) : 0

      const currency = 'USD'

      const statusHeader = mapping['status']
      const rawStatus = statusHeader ? String(row[statusHeader] || '').trim().toUpperCase() : ''
      const status = UNIT_STATUS_MAP[rawStatus] || 'AVAILABLE'

      const viewHeader = mapping['view']
      const view = viewHeader ? String(row[viewHeader] || '').trim() : null

      const floorHeader = mapping['floor']
      const floor = floorHeader ? parseInt(row[floorHeader], 10) || null : null

      const livingAreaSizeHeader = mapping['livingAreaSize']
      const livingAreaSize = livingAreaSizeHeader ? parseFloat(row[livingAreaSizeHeader]) || null : null

      const balconySizeHeader = mapping['balconySize']
      const balconySize = balconySizeHeader ? parseFloat(row[balconySizeHeader]) || null : null

      const terraceSizeHeader = mapping['terraceSize']
      const terraceSize = terraceSizeHeader ? parseFloat(row[terraceSizeHeader]) || null : null

      const greenyardSizeHeader = mapping['greenyardSize']
      const greenyardSize = greenyardSizeHeader ? parseFloat(row[greenyardSizeHeader]) || null : null

      const deliveryFormHeader = mapping['deliveryForm']
      const deliveryForm = deliveryFormHeader ? String(row[deliveryFormHeader] || '').trim() : null

      const blackFramePriceHeader = mapping['blackFramePrice']
      const blackFramePrice = blackFramePriceHeader ? parseFloat(row[blackFramePriceHeader]) || null : null
      const blackFrame = (blackFramePrice !== null && blackFramePrice > 0)

      const whiteFramePriceHeader = mapping['whiteFramePrice']
      const whiteFramePrice = whiteFramePriceHeader ? parseFloat(row[whiteFramePriceHeader]) || null : null
      const whiteFrame = (whiteFramePrice !== null && whiteFramePrice > 0)

      const greenFramePriceHeader = mapping['greenFramePrice']
      const greenFramePrice = greenFramePriceHeader ? parseFloat(row[greenFramePriceHeader]) || null : null
      const greenFrame = (greenFramePrice !== null && greenFramePrice > 0)

      const turnkeyPriceHeader = mapping['turnkeyPrice']
      const turnkeyPrice = turnkeyPriceHeader ? parseFloat(row[turnkeyPriceHeader]) || null : null
      const turnkey = (turnkeyPrice !== null && turnkeyPrice > 0)

      const floorPlanUrlHeader = mapping['floorPlanUrl']
      const floorPlanUrl = floorPlanUrlHeader ? String(row[floorPlanUrlHeader] || '').trim() : null

      // Check if unit exists in project
      const existing = await prisma.unit.findFirst({
        where: {
          projectId,
          unitNumber
        }
      })

      const unitData = {
        unitNumber,
        projectId,
        type: type as any,
        bedrooms,
        bathrooms,
        size,
        price,
        currency,
        status: status as any,
        view,
        floor,
        livingAreaSize,
        balconySize,
        terraceSize,
        greenyardSize,
        deliveryForm,
        blackFrame,
        whiteFrame,
        greenFrame,
        turnkey,
        blackFramePrice,
        whiteFramePrice,
        greenFramePrice,
        turnkeyPrice,
        floorPlanUrl
      }

      if (existing) {
        await prisma.unit.update({
          where: { id: existing.id },
          data: unitData
        })
        updatedCount++
      } else {
        await prisma.unit.create({
          data: unitData
        })
        createdCount++
      }
    }

    return NextResponse.json({ success: true, createdCount, updatedCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
