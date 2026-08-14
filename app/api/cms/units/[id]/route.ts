import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { UnitService } from '@/server/services/UnitService'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Units', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const unit = await UnitService.getUnit(id)
    if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(unit)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Units', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const body = await request.json()
    
    if (body.type !== undefined) {
      body.type = String(body.type || '').trim() || 'APARTMENT'
    }

    // Parse numeric fields
    if (body.bedrooms !== undefined && body.bedrooms !== null && body.bedrooms !== '') body.bedrooms = Number(body.bedrooms)
    else if (body.bedrooms === '' || body.bedrooms === null) body.bedrooms = null
    if (body.bathrooms !== undefined && body.bathrooms !== null && body.bathrooms !== '') body.bathrooms = Number(body.bathrooms)
    else if (body.bathrooms === '' || body.bathrooms === null) body.bathrooms = null
    if (body.size !== undefined && body.size !== null && body.size !== '') body.size = Number(body.size)
    else if (body.size === '' || body.size === null) body.size = null
    if (body.price !== undefined && body.price !== null && body.price !== '') body.price = Number(body.price)
    else if (body.price === '' || body.price === null) body.price = null
    if (body.priceSqm !== undefined && body.priceSqm !== null && body.priceSqm !== '') body.priceSqm = Number(body.priceSqm)
    else if (body.priceSqm === '' || body.priceSqm === null) body.priceSqm = null
    if (body.projectId) body.projectId = Number(body.projectId)
    if (body.livingAreaSize !== undefined && body.livingAreaSize !== null && body.livingAreaSize !== '') body.livingAreaSize = Number(body.livingAreaSize)
    else delete body.livingAreaSize
    if (body.balconySize !== undefined && body.balconySize !== null && body.balconySize !== '') body.balconySize = Number(body.balconySize)
    else delete body.balconySize
    if (body.terraceSize !== undefined && body.terraceSize !== null && body.terraceSize !== '') body.terraceSize = Number(body.terraceSize)
    else delete body.terraceSize
    if (body.greenyardSize !== undefined && body.greenyardSize !== null && body.greenyardSize !== '') body.greenyardSize = Number(body.greenyardSize)
    else delete body.greenyardSize

    // Frame flags
    body.blackFrame = body.blackFrame === true || body.blackFrame === 'true'
    body.whiteFrame = body.whiteFrame === true || body.whiteFrame === 'true'
    body.greenFrame = body.greenFrame === true || body.greenFrame === 'true'
    body.turnkey = body.turnkey === true || body.turnkey === 'true'

    // Frame prices
    if (body.blackFramePrice !== undefined && body.blackFramePrice !== null && body.blackFramePrice !== '') body.blackFramePrice = Number(body.blackFramePrice)
    else delete body.blackFramePrice
    if (body.whiteFramePrice !== undefined && body.whiteFramePrice !== null && body.whiteFramePrice !== '') body.whiteFramePrice = Number(body.whiteFramePrice)
    else delete body.whiteFramePrice
    if (body.greenFramePrice !== undefined && body.greenFramePrice !== null && body.greenFramePrice !== '') body.greenFramePrice = Number(body.greenFramePrice)
    else delete body.greenFramePrice
    if (body.greenFramePriceSqm !== undefined && body.greenFramePriceSqm !== null && body.greenFramePriceSqm !== '') body.greenFramePriceSqm = Number(body.greenFramePriceSqm)
    else delete body.greenFramePriceSqm
    if (body.whiteFramePriceSqm !== undefined && body.whiteFramePriceSqm !== null && body.whiteFramePriceSqm !== '') body.whiteFramePriceSqm = Number(body.whiteFramePriceSqm)
    else delete body.whiteFramePriceSqm
    if (body.blackFramePriceSqm !== undefined && body.blackFramePriceSqm !== null && body.blackFramePriceSqm !== '') body.blackFramePriceSqm = Number(body.blackFramePriceSqm)
    else delete body.blackFramePriceSqm
    if (body.renovationPriceSqm !== undefined && body.renovationPriceSqm !== null && body.renovationPriceSqm !== '') body.renovationPriceSqm = Number(body.renovationPriceSqm)
    else delete body.renovationPriceSqm
    if (body.renovationPrice !== undefined && body.renovationPrice !== null && body.renovationPrice !== '') body.renovationPrice = Number(body.renovationPrice)
    else delete body.renovationPrice
    if (body.handover !== undefined && body.handover !== null && body.handover !== '') body.handover = new Date(body.handover)
    else delete body.handover
    if (body.building !== undefined && body.building !== null) body.building = String(body.building).trim()
    else delete body.building
    if (body.turnkeyCalcMethod !== undefined && body.turnkeyCalcMethod !== null) body.turnkeyCalcMethod = String(body.turnkeyCalcMethod).trim()
    else delete body.turnkeyCalcMethod
    if (body.turnkeyPrice !== undefined && body.turnkeyPrice !== null && body.turnkeyPrice !== '') body.turnkeyPrice = Number(body.turnkeyPrice)
    else delete body.turnkeyPrice
    if (body.floorPlanUrl2 !== undefined && body.floorPlanUrl2 !== null) body.floorPlanUrl2 = String(body.floorPlanUrl2).trim()
    else delete body.floorPlanUrl2

    const unit = await UnitService.updateUnit(id, body)
    return NextResponse.json(unit)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Units', AccessLevel.EDIT, true)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    await UnitService.deleteUnit(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
