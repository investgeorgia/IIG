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
    customPrice?: number
    discountPercent?: number
    customerMessage?: string
    notes?: string
    selectedImages?: string[]
    snapshot?: object
  }) {
    return prisma.proposal.update({
      where: { id },
      data: {
        ...(data.customPrice !== undefined && { customPrice: data.customPrice }),
        ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent }),
        ...(data.customerMessage !== undefined && { customerMessage: data.customerMessage }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.selectedImages !== undefined && { selectedImages: data.selectedImages }),
        ...(data.snapshot !== undefined && { snapshot: data.snapshot }),
      },
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
