/**
 * Shared helper: takes a proposal and returns fully-rendered HTML.
 *
 * - If the proposal has a template (stored HTML), it substitutes all
 *   {{placeholders}} including the inlined SVG logo, payment plan rows,
 *   prices, amenities, floor plan, and gallery page.
 * - Otherwise falls back to generateSalesOfferHtml().
 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { generateSalesOfferHtml } from './SalesOfferHtmlService'

const USD_TO_AED = 3.6725

function formatNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function getLogoSvgDataUri(): string {
  const logoPath = path.join(process.cwd(), 'public', 'logo-black.svg')
  if (!existsSync(logoPath)) return ''
  const svgContent = readFileSync(logoPath, 'utf-8')
  const b64 = Buffer.from(svgContent).toString('base64')
  return `data:image/svg+xml;base64,${b64}`
}

function buildLogoImgTag(baseUrl: string): string {
  const logoDataUri = getLogoSvgDataUri()
  return logoDataUri
    ? `<img src="${logoDataUri}" style="height:46px;width:auto;object-fit:contain;" alt="Invest Georgia" />`
    : `<img src="${baseUrl}/logo-black.svg" style="height:46px;width:auto;object-fit:contain;" alt="Invest Georgia" />`
}

function buildPaymentPlanRows(
  customPaymentPlan: { milestone: string; percentage: number; date: string }[],
  finalPriceUSD: number
): string {
  if (!customPaymentPlan || customPaymentPlan.length === 0) {
    return `<tr>
      <td colspan="6" style="padding:42px 14px;text-align:center;color:#94A3B8;font-style:italic;font-size:12px;">
        No payment plan milestones currently specified for this quotation.
      </td>
    </tr>`
  }

  return customPaymentPlan
    .map((m, i) => {
      const amtUSD = (finalPriceUSD * m.percentage) / 100
      const amtAED = amtUSD * USD_TO_AED
      return `<tr>
        <td style="text-align:center;color:#64748B;">${i + 1}</td>
        <td style="font-weight:500;">${m.milestone}</td>
        <td style="text-align:center;">${m.percentage}%</td>
        <td style="text-align:center;color:#475569;">${m.date}</td>
        <td style="text-align:right;font-weight:500;">$${formatNum(amtUSD)}</td>
        <td style="text-align:right;color:#475569;">AED ${formatNum(amtAED)}</td>
      </tr>`
    })
    .join('')
}

function buildFloorPlanHtml(floorPlanUrl: string | undefined): string {
  if (floorPlanUrl) {
    return `<div style="width:100%;height:380px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;background:#F8FAFC;">
      <img src="${floorPlanUrl}" style="width:100%;height:100%;object-fit:contain;" />
    </div>`
  }
  return `<div style="width:100%;height:380px;border:2px dashed #CBD5E1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#F8FAFC;color:#94A3B8;">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px;opacity:0.5;">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <path d="M3 9h18"></path>
      <path d="M9 21V9"></path>
    </svg>
    <span style="font-size:13px;font-weight:500;">No floor plan image uploaded</span>
  </div>`
}

function buildAmenitiesHtml(amenities: string[]): string {
  if (!amenities || amenities.length === 0) return ''

  let rows = ''
  for (let r = 0; r < Math.ceil(amenities.length / 3); r++) {
    const isLast = r === Math.ceil(amenities.length / 3) - 1
    rows += `<tr style="border-bottom:${isLast ? 'none' : '1px solid #F1F5F9'};">`
    for (let c = 0; c < 3; c++) {
      const a = amenities[r * 3 + c] || ''
      rows += `<td style="padding:10px 14px;font-size:13px;width:33%;">${a}</td>`
    }
    rows += '</tr>'
  }

  return `<div style="margin-bottom:24px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0F172A;margin-bottom:12px;">Amenities</div>
    <table style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
      <tbody>${rows}</tbody>
    </table>
  </div>`
}

function buildGalleryPageHtml(selectedImages: string[], logoImgTag: string): string {
  if (!selectedImages || selectedImages.length === 0) return ''

  const galleryItems = selectedImages
    .map(
      (url) => `<div style="aspect-ratio:16/9;overflow:hidden;border-radius:8px;border:1px solid #E2E8F0;background:#F1F5F9;">
        <img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>`
    )
    .join('')

  return `<div style="width:794px;min-height:1123px;background:#FFFFFF;padding:50px 56px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;box-sizing:border-box;display:flex;flex-direction:column;">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:24px;border-bottom:2px solid #F1F5F9;margin-bottom:32px;">
      <div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#0F172A;">SALES OFFER</div>
        <div style="font-size:12px;color:#64748B;margin-top:4px;font-weight:500;">Property Gallery</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">${logoImgTag}</div>
    </div>

    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C0392B;margin-bottom:16px;">Property Images</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      ${galleryItems}
    </div>
  </div>`
}

export function buildProposalHtml(proposal: any, baseUrl: string = ''): string {
  // Parse selected images
  let selectedImages: string[] = []
  const rawImgs = proposal.selectedImages
  if (Array.isArray(rawImgs)) {
    selectedImages = rawImgs as string[]
  } else if (typeof rawImgs === 'string') {
    try {
      selectedImages = JSON.parse(rawImgs)
    } catch {}
  }
  if (!Array.isArray(selectedImages)) selectedImages = []

  const snap = proposal.snapshot as any

  // If no template stored, use the generated HTML (already has gallery)
  if (!proposal.template || !proposal.template.content) {
    return generateSalesOfferHtml(proposal, baseUrl)
  }

  // --- Compute values ---
  const basePrice = Number(snap?.unit?.price || 0)
  const discountAmount = proposal.discountPercent
    ? basePrice * (proposal.discountPercent / 100)
    : 0
  const finalPriceNum = proposal.customPrice
    ? Number(proposal.customPrice)
    : basePrice - discountAmount
  const finalPriceUSD = finalPriceNum
  const finalPriceAED = finalPriceNum * USD_TO_AED

  const completionDate = snap?.project?.completionDate
    ? new Date(snap.project.completionDate).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const roi = snap?.project?.roi ? `${snap.project.roi}% p.a.` : '—'

  const customPaymentPlan: { milestone: string; percentage: number; date: string }[] =
    snap?.customPaymentPlan && Array.isArray(snap.customPaymentPlan)
      ? snap.customPaymentPlan
      : []

  const amenities: string[] = snap?.amenities || []
  const consultantName = proposal.createdBy?.name || 'Invest Georgia UAE'
  const consultantPhone = proposal.createdBy?.phone || ''

  const defaultCustomerMessage =
    'Taking into consideration your preferences and key investment goals, we have carefully selected the following opportunity that aligns with your criteria and demonstrates exceptional growth potential.'

  // --- Build HTML fragments ---
  const logoImgTag = buildLogoImgTag(baseUrl)
  const paymentPlanRows = buildPaymentPlanRows(customPaymentPlan, finalPriceUSD)
  const floorPlanHtml = buildFloorPlanHtml(snap?.unit?.floorPlanUrl)
  const amenitiesHtml = buildAmenitiesHtml(amenities)
  const galleryPageHtml = buildGalleryPageHtml(selectedImages, logoImgTag)

  // --- Substitute all placeholders ---
  let html = proposal.template.content
    // Core data
    .replace(/{{customerName}}/g, proposal.customer?.name || '')
    .replace(/{{customerMessage}}/g, proposal.customerMessage || defaultCustomerMessage)
    .replace(/{{unitNumber}}/g, snap?.unit?.unitNumber || '—')
    .replace(/{{towerBlock}}/g, snap?.unit?.towerBlock || '—')
    .replace(/{{projectName}}/g, snap?.project?.name || '—')
    .replace(/{{completionDate}}/g, completionDate)
    .replace(/{{finalPriceUSD}}/g, `$${formatNum(finalPriceUSD)}`)
    .replace(/{{finalPriceAED}}/g, `AED ${formatNum(finalPriceAED)}`)
    .replace(/{{roi}}/g, roi)
    .replace(/{{consultantName}}/g, consultantName)
    .replace(/{{consultantPhone}}/g, consultantPhone)
    .replace(/{{baseUrl}}/g, baseUrl)
    // Dynamic HTML blocks
    .replace(/{{paymentPlanRows}}/g, paymentPlanRows)
    .replace(/{{floorPlanHtml}}/g, floorPlanHtml)
    .replace(/{{amenitiesHtml}}/g, amenitiesHtml)
    .replace(/{{galleryPage}}/g, galleryPageHtml)
    // Logo: replace any <img> referencing logo-black.svg with inlined base64
    .replace(
      /<img([^>]*?)src=["'][^"']*logo-black\.svg["']([^>]*?)\/?>/gi,
      logoImgTag
    )

  return html
}
