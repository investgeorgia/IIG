import { Prisma } from '@prisma/client'
import { ProposalRepository } from '../repositories/ProposalRepository'
import { prisma } from '@/lib/prisma'

export class ProposalService {
  static async getAll(where?: Prisma.ProposalWhereInput) {
    return ProposalRepository.findAll(where)
  }

  static async getById(id: number) {
    return ProposalRepository.findById(id)
  }

  /**
   * Creates a proposal with a full data snapshot.
   * The snapshot freezes all project/unit data at the time of creation.
   */
  static async create(data: {
    customerId: number
    unitId: number
    createdById: number
    customPrice?: number
    discountPercent?: number
    notes?: string
    customerMessage?: string
    selectedImages?: string[]
    selectedFloors?: string[]
    templateId?: number
    towerBlock?: string
    unitCondition?: string
    paymentPlan?: { id: number, milestone: string, percentage: number, date: string, subMilestones?: any[] }[]
    customFloorPlanUrl?: string
    customFloorPlanUrl2?: string
    pricingType?: string
    selectedPrice?: number
    paymentPlanName?: string
    visibleFields?: string[]
    handover?: string | Date
  }) {
    // 1. Load full unit + project + developer data for snapshot
    const unit = await prisma.unit.findUnique({
      where: { id: data.unitId },
      include: {
        project: {
          include: {
            developer: true,
            amenities: { include: { amenity: true } },
            paymentPlans: true,
            media: true
          }
        }
      }
    })

    if (!unit) throw new Error('Unit not found')

    // Save custom floor plan URL to unit if provided
    if (data.customFloorPlanUrl) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: { floorPlanUrl: data.customFloorPlanUrl }
      })
      unit.floorPlanUrl = data.customFloorPlanUrl
    }

    if (data.customFloorPlanUrl2) {
      await prisma.unit.update({
        where: { id: unit.id },
        data: { floorPlanUrl2: data.customFloorPlanUrl2 }
      })
      // @ts-ignore
      unit.floorPlanUrl2 = data.customFloorPlanUrl2
    }

    // Save custom payment plan to unit if provided
    if (data.paymentPlan && data.paymentPlan.length > 0) {
      const planName = data.paymentPlanName || 'Custom Plan'
      const existingPlan = await prisma.paymentPlan.findFirst({
        where: {
          unitId: unit.id,
          name: planName
        }
      })

      if (existingPlan) {
        await prisma.paymentPlan.update({
          where: { id: existingPlan.id },
          data: {
            schedule: data.paymentPlan as any
          }
        })
      } else {
        await prisma.paymentPlan.create({
          data: {
            projectId: unit.projectId,
            unitId: unit.id,
            name: planName,
            schedule: data.paymentPlan as any
          }
        })
      }
    }

    // 2. Build immutable snapshot
    const snapshot = {
      unit: {
        id: unit.id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        size: Number(unit.size),
        price: Number(unit.price),
        currency: unit.currency,
        view: unit.view,
        floor: unit.floor,
        livingAreaSize: unit.livingAreaSize ? Number(unit.livingAreaSize) : null,
        balconySize: unit.balconySize ? Number(unit.balconySize) : null,
        terraceSize: unit.terraceSize ? Number(unit.terraceSize) : null,
        greenyardSize: unit.greenyardSize ? Number(unit.greenyardSize) : null,
        deliveryForm: unit.deliveryForm,
        blackFrame: unit.blackFrame,
        whiteFrame: unit.whiteFrame,
        greenFrame: unit.greenFrame,
        turnkey: unit.turnkey,
        blackFramePrice: unit.blackFramePrice ? Number(unit.blackFramePrice) : null,
        whiteFramePrice: unit.whiteFramePrice ? Number(unit.whiteFramePrice) : null,
        greenFramePrice: unit.greenFramePrice ? Number(unit.greenFramePrice) : null,
        turnkeyPrice: unit.turnkeyPrice ? Number(unit.turnkeyPrice) : null,
        greenFramePriceSqm: unit.greenFramePriceSqm ? Number(unit.greenFramePriceSqm) : null,
        whiteFramePriceSqm: unit.whiteFramePriceSqm ? Number(unit.whiteFramePriceSqm) : null,
        blackFramePriceSqm: unit.blackFramePriceSqm ? Number(unit.blackFramePriceSqm) : null,
        renovationPriceSqm: unit.renovationPriceSqm ? Number(unit.renovationPriceSqm) : null,
        renovationPrice: unit.renovationPrice ? Number(unit.renovationPrice) : null,
        handover: unit.handover ? unit.handover.toISOString() : null,
        building: unit.building || null,
        turnkeyCalcMethod: unit.turnkeyCalcMethod || "TOTAL_AREA",
        status: unit.status,
        floorPlanUrl: data.customFloorPlanUrl || unit.floorPlanUrl,
        // @ts-ignore
        floorPlanUrl2: data.customFloorPlanUrl2 || unit.floorPlanUrl2,
        towerBlock: data.towerBlock,
        condition: data.unitCondition,
      },
      project: {
        id: unit.project.id,
        name: unit.project.name,
        description: unit.project.description,
        address: unit.project.address,
        city: unit.project.city,
        country: unit.project.country,
        status: unit.project.status,
        completionDate: unit.project.completionDate,
        startingPrice: unit.project.startingPrice ? Number(unit.project.startingPrice) : null,
        roi: unit.project.roi,
        coverImageUrl: unit.project.coverImageUrl,
      },
      developer: {
        id: unit.project.developer.id,
        name: unit.project.developer.name,
        logoUrl: unit.project.developer.logoUrl,
        website: unit.project.developer.website,
      },
      amenities: unit.project.amenities.map(pa => pa.amenity.name),
      paymentPlans: unit.project.paymentPlans.map(pp => ({ name: pp.name, description: pp.description })),
      customPaymentPlan: data.paymentPlan || [],
      media: unit.project.media.map(m => ({ url: m.url, type: m.type, name: m.name })),
      snapshotAt: new Date().toISOString()
    }

    let finalTemplateId = data.templateId
    if (!finalTemplateId) {
      const defaultTemplate = (await prisma.proposalTemplate.findFirst({
        where: { isDefault: true }
      })) || (await prisma.proposalTemplate.findFirst())

      if (defaultTemplate) {
        finalTemplateId = defaultTemplate.id
      }
    }

    const customHandover = data.handover ? new Date(data.handover) : undefined

    return ProposalRepository.create({
      ...data,
      templateId: finalTemplateId,
      snapshot,
      handover: customHandover
    })
  }

  static async updateStatus(id: number, status: string) {
    return ProposalRepository.updateStatus(id, status)
  }

  static async linkPdf(id: number, pdfUrl: string) {
    return ProposalRepository.updatePdf(id, pdfUrl)
  }

  static async update(id: number, data: {
    customPrice?: number | null
    discountPercent?: number | null
    customerMessage?: string
    notes?: string
    selectedImages?: string[]
    towerBlock?: string
    unitCondition?: string
    paymentPlan?: { id: number, milestone: string, percentage: number, date: string }[]
  }) {
    // Load current proposal to mutate snapshot
    const current = await ProposalRepository.findById(id)
    if (!current) throw new Error('Proposal not found')

    const snap = current.snapshot as any

    // Merge tower/condition/paymentPlan into snapshot
    const updatedSnapshot = {
      ...snap,
      unit: {
        ...snap.unit,
        towerBlock: data.towerBlock ?? snap.unit?.towerBlock,
        condition: data.unitCondition ?? snap.unit?.condition,
      },
      customPaymentPlan: data.paymentPlan ?? snap.customPaymentPlan ?? [],
    }

    return ProposalRepository.update(id, {
      customPrice: data.customPrice ?? undefined,
      discountPercent: data.discountPercent ?? undefined,
      customerMessage: data.customerMessage,
      notes: data.notes,
      selectedImages: data.selectedImages,
      snapshot: updatedSnapshot,
    })
  }

  static async delete(id: number) {
    return ProposalRepository.delete(id)
  }
}
