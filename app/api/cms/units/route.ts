import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { UnitService } from '@/server/services/UnitService'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Units', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    body.type = String(body.type || '').trim() || 'APARTMENT'

    // Parse numeric fields
    if (body.bedrooms !== undefined && body.bedrooms !== null && body.bedrooms !== '') body.bedrooms = Number(body.bedrooms)
    else delete body.bedrooms
    if (body.bathrooms !== undefined && body.bathrooms !== null && body.bathrooms !== '') body.bathrooms = Number(body.bathrooms)
    else delete body.bathrooms
    if (body.size !== undefined && body.size !== null && body.size !== '') body.size = Number(body.size)
    else delete body.size
    if (body.price !== undefined && body.price !== null && body.price !== '') body.price = Number(body.price)
    else delete body.price
    if (body.priceSqm !== undefined && body.priceSqm !== null && body.priceSqm !== '') body.priceSqm = Number(body.priceSqm)
    else delete body.priceSqm
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
    if (body.turnkeyPrice !== undefined && body.turnkeyPrice !== null && body.turnkeyPrice !== '') body.turnkeyPrice = Number(body.turnkeyPrice)
    else delete body.turnkeyPrice
    
    const unit = await UnitService.createUnit(body)
    return NextResponse.json(unit, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
