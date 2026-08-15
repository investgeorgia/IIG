import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class ProposalRepository {
  static async findAll(where?: Prisma.ProposalWhereInput) {
    return prisma.proposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        createdBy: { select: { id: true, name: true } }
      }
    })
  }

  static async findById(id: number) {
    return prisma.proposal.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, phone: true } },
        template: true
      }
    })
  }

  static async create(data: {
    customerId: number
    unitId: number
    createdById: number
    snapshot: object
    customPrice?: number
    discountPercent?: number
    notes?: string
    customerMessage?: string
    selectedImages?: string[]
    selectedFloors?: string[]
    templateId?: number
    pricingType?: string
    selectedPrice?: number
    paymentPlanName?: string
    visibleFields?: string[]
    handover?: Date
  }) {
    return prisma.proposal.create({
      data: {
        customerId: data.customerId,
        unitId: data.unitId,
        createdById: data.createdById,
        snapshot: data.snapshot,
        customPrice: data.customPrice,
        discountPercent: data.discountPercent,
        notes: data.notes,
        customerMessage: data.customerMessage,
        selectedImages: data.selectedImages ?? undefined,
        selectedFloors: data.selectedFloors ?? undefined,
        templateId: data.templateId,
        pricingType: data.pricingType,
        selectedPrice: data.selectedPrice,
        paymentPlanName: data.paymentPlanName,
        visibleFields: data.visibleFields ?? undefined,
        handover: data.handover ?? undefined,
      }
    })
  }

  static async updateStatus(id: number, status: string) {
    return prisma.proposal.update({ where: { id }, data: { status: status as any } })
  }

  static async updatePdf(id: number, pdfUrl: string) {
    return prisma.proposal.update({
      where: { id },
      data: { pdfUrl, pdfGeneratedAt: new Date() }
    })
  }

  static async update(id: number, data: {
    customPrice?: number | null
    discountPercent?: number | null
    customerMessage?: string
    notes?: string
    selectedImages?: string[]
    snapshot?: object
    pricingType?: string | null
    selectedPrice?: number | null
    paymentPlanName?: string | null
    visibleFields?: string[] | null
    handover?: Date | null
    templateId?: number | null
  }) {
    return prisma.proposal.update({
      where: { id },
      data: {
        ...(data.customPrice !== undefined && { customPrice: data.customPrice ?? null }),
        ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent ?? null }),
        ...(data.customerMessage !== undefined && { customerMessage: data.customerMessage ?? null }),
        ...(data.notes !== undefined && { notes: data.notes ?? null }),
        ...(data.selectedImages !== undefined && { selectedImages: data.selectedImages ?? null }),
        ...(data.snapshot !== undefined && { snapshot: data.snapshot as any }),
        ...(data.pricingType !== undefined && { pricingType: data.pricingType ?? null }),
        ...(data.selectedPrice !== undefined && { selectedPrice: data.selectedPrice ?? null }),
        ...(data.paymentPlanName !== undefined && { paymentPlanName: data.paymentPlanName ?? null }),
        ...(data.visibleFields !== undefined && { visibleFields: data.visibleFields ?? null }),
        ...(data.handover !== undefined && { handover: data.handover ?? null }),
        ...(data.templateId !== undefined && { templateId: data.templateId ?? null }),
      } as any,
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, phone: true } },
        template: true
      }
    })
  }

  static async delete(id: number) {
    return prisma.proposal.delete({ where: { id } })
  }
}
