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

function cleanFloat(val: any): number | null {
  if (val === undefined || val === null || val === '') return null
  const str = String(val).trim()
  const cleaned = str.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

function cleanInt(val: any): number | null {
  if (val === undefined || val === null || val === '') return null
  const str = String(val).trim()
  const cleaned = str.replace(/[^0-9-]/g, '')
  const parsed = parseInt(cleaned, 10)
  return isNaN(parsed) ? null : parsed
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const projectId = Number((await params).id)
    const { rows, mapping, turnkeyCalcMethod: requestTurnkeyCalcMethod } = await request.json()

    if (!Array.isArray(rows) || !mapping) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
    }

    const turnkeyCalcMethod = requestTurnkeyCalcMethod || 'TOTAL_AREA'

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
      const bedrooms = bedroomsHeader ? Math.max(0, cleanInt(row[bedroomsHeader]) || 0) : 0

      const bathroomsHeader = mapping['bathrooms']
      const bathrooms = bathroomsHeader ? Math.max(0, cleanInt(row[bathroomsHeader]) || 0) : 0

      const sizeHeader = mapping['size']
      const size = sizeHeader ? Math.max(0, cleanFloat(row[sizeHeader]) || 0) : 0

      const priceHeader = mapping['price']
      const price = priceHeader ? Math.max(0, cleanFloat(row[priceHeader]) || 0) : 0

      const currency = 'USD'

      const statusHeader = mapping['status']
      const rawStatus = statusHeader ? String(row[statusHeader] || '').trim().toUpperCase() : ''
      const status = UNIT_STATUS_MAP[rawStatus] || 'AVAILABLE'

      const viewHeader = mapping['view']
      const view = viewHeader ? String(row[viewHeader] || '').trim() : null

      const floorHeader = mapping['floor']
      const floor = floorHeader ? cleanInt(row[floorHeader]) : null

      const livingAreaSizeHeader = mapping['livingAreaSize']
      const livingAreaSize = livingAreaSizeHeader ? cleanFloat(row[livingAreaSizeHeader]) : null

      const balconySizeHeader = mapping['balconySize']
      const balconySize = balconySizeHeader ? cleanFloat(row[balconySizeHeader]) : null

      const terraceSizeHeader = mapping['terraceSize']
      const terraceSize = terraceSizeHeader ? cleanFloat(row[terraceSizeHeader]) : null

      const greenyardSizeHeader = mapping['greenyardSize']
      const greenyardSize = greenyardSizeHeader ? cleanFloat(row[greenyardSizeHeader]) : null

      const deliveryFormHeader = mapping['deliveryForm']
      const deliveryForm = deliveryFormHeader ? String(row[deliveryFormHeader] || '').trim() : null

      const blackFramePriceHeader = mapping['blackFramePrice']
      const blackFramePrice = blackFramePriceHeader ? cleanFloat(row[blackFramePriceHeader]) : null
      const blackFrame = (blackFramePrice !== null && blackFramePrice > 0)

      const whiteFramePriceHeader = mapping['whiteFramePrice']
      const whiteFramePrice = whiteFramePriceHeader ? cleanFloat(row[whiteFramePriceHeader]) : null
      const whiteFrame = (whiteFramePrice !== null && whiteFramePrice > 0)

      const greenFramePriceHeader = mapping['greenFramePrice']
      const greenFramePrice = greenFramePriceHeader ? cleanFloat(row[greenFramePriceHeader]) : null
      const greenFrame = (greenFramePrice !== null && greenFramePrice > 0)

      const floorPlanUrlHeader = mapping['floorPlanUrl']
      const floorPlanUrl = floorPlanUrlHeader ? String(row[floorPlanUrlHeader] || '').trim() : null

      const buildingHeader = mapping['building']
      const building = buildingHeader ? String(row[buildingHeader] || '').trim() : null

      const towerBlockHeader = mapping['towerBlock']
      const towerBlock = towerBlockHeader ? String(row[towerBlockHeader] || '').trim() : null

      const priceSqmHeader = mapping['priceSqm']
      let priceSqm = priceSqmHeader ? cleanFloat(row[priceSqmHeader]) : null
      if (priceSqm === null && price > 0 && size > 0) {
        priceSqm = Number((price / size).toFixed(2))
      }

      const blackFramePriceSqmHeader = mapping['blackFramePriceSqm']
      const blackFramePriceSqm = blackFramePriceSqmHeader ? cleanFloat(row[blackFramePriceSqmHeader]) : null

      const whiteFramePriceSqmHeader = mapping['whiteFramePriceSqm']
      const whiteFramePriceSqm = whiteFramePriceSqmHeader ? cleanFloat(row[whiteFramePriceSqmHeader]) : null

      const greenFramePriceSqmHeader = mapping['greenFramePriceSqm']
      const greenFramePriceSqm = greenFramePriceSqmHeader ? cleanFloat(row[greenFramePriceSqmHeader]) : null

      const renovationPriceHeader = mapping['renovationPrice']
      const renovationPrice = renovationPriceHeader ? cleanFloat(row[renovationPriceHeader]) : null

      const renovationPriceSqmHeader = mapping['renovationPriceSqm']
      const renovationPriceSqm = renovationPriceSqmHeader ? cleanFloat(row[renovationPriceSqmHeader]) : null

      let turnkeyPrice = null
      let turnkey = false

      if (turnkeyCalcMethod !== 'NONE' && priceSqm && priceSqm > 0) {
        const area = (turnkeyCalcMethod === 'LIVING_AREA' && livingAreaSize) ? livingAreaSize : size
        if (area && area > 0) {
          turnkeyPrice = priceSqm * area
          turnkey = true
        }
      }

      if (!turnkeyPrice) {
        const turnkeyPriceHeader = mapping['turnkeyPrice']
        const mappedTurnkeyPrice = turnkeyPriceHeader ? cleanFloat(row[turnkeyPriceHeader]) : null
        if (mappedTurnkeyPrice !== null && mappedTurnkeyPrice > 0) {
          turnkeyPrice = mappedTurnkeyPrice
          turnkey = true
        }
      }

      let handover = null
      const handoverHeader = mapping['handover']
      if (handoverHeader && row[handoverHeader]) {
        const parsedDate = Date.parse(row[handoverHeader])
        if (!isNaN(parsedDate)) {
          handover = new Date(parsedDate)
        }
      }

      // Check if unit exists in project
      const existing = await prisma.unit.findFirst({
        where: {
          projectId,
          unitNumber,
          ...(building ? { building } : {
            OR: [
              { building: null },
              { building: '' }
            ]
          })
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
        floorPlanUrl,
        building,
        towerBlock,
        priceSqm,
        blackFramePriceSqm,
        whiteFramePriceSqm,
        greenFramePriceSqm,
        renovationPrice,
        renovationPriceSqm,
        turnkeyCalcMethod,
        handover
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
