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
  customPaymentPlan: { milestone: string; percentage: number; date: string, subMilestones?: any[] }[],
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
    .flatMap((m, i) => {
      const amtUSD = (finalPriceUSD * m.percentage) / 100
      const amtAED = amtUSD * USD_TO_AED
      const rows = []
      rows.push(`<tr>
        <td style="text-align:center;color:#64748B;">${i + 1}</td>
        <td style="font-weight:700;">${m.milestone}</td>
        <td style="text-align:center;font-weight:700;">${m.percentage}%</td>
        <td style="text-align:center;color:#475569;font-weight:600;">${m.date}</td>
        <td style="text-align:right;font-weight:700;">$${formatNum(amtUSD)}</td>
        <td style="text-align:right;color:#475569;font-weight:600;">AED ${formatNum(amtAED)}</td>
      </tr>`)

      if (m.subMilestones && m.subMilestones.length > 0) {
        m.subMilestones.forEach((sub: any, subIdx: number) => {
          const subAmtUSD = (amtUSD * (Number(sub.percentage) || 0)) / 100
          const subAmtAED = subAmtUSD * USD_TO_AED
          rows.push(`<tr>
            <td style="text-align:center;color:#94A3B8;font-size:10px;">${i + 1}.${subIdx + 1}</td>
            <td style="font-weight:400;padding-left:24px;color:#475569;"><span style="color:#CBD5E1;margin-right:4px;">-</span> ${sub.milestone}</td>
            <td style="text-align:center;color:#475569;">${sub.percentage}%</td>
            <td style="text-align:center;color:#64748B;">${sub.date}</td>
            <td style="text-align:right;font-weight:500;color:#475569;">$${formatNum(subAmtUSD)}</td>
            <td style="text-align:right;color:#64748B;">AED ${formatNum(subAmtAED)}</td>
          </tr>`)
        })
      }
      return rows
    })
    .join('')
}

function buildFloorPlanHtml(floorPlanUrl: string | undefined): string {
  if (floorPlanUrl) {
    return `<div style="margin-bottom: 32px;">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0F172A; margin-bottom: 12px;">Floor Plan &amp; Layout</div>
      <div style="width:100%;height:380px;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;background:#F8FAFC;">
        <img src="${floorPlanUrl}" style="width:100%;height:100%;object-fit:contain;" />
      </div>
    </div>`
  }
  return ''
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
      (url) => `<div class="gallery-item">
        <img src="${url}" />
      </div>`
    )
    .join('')

  return `<div class="page">
  <div>
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 2px solid #F1F5F9; margin-bottom: 32px;">
      <div>
        <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #0F172A;">SALES OFFER</div>
        <div style="font-size: 12px; color: #64748B; margin-top: 4px; font-weight: 500;">Property Gallery</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">${logoImgTag}</div>
    </div>

    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #C0392B; margin-bottom: 16px;">Property Images</div>
    <div class="gallery-grid">
      ${galleryItems}
    </div>
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
  const consultantEmail = proposal.createdBy?.email || 'info@investgeorgia.ae'

  // --- Unit details ---
  const unitTypeMap: Record<string, string> = {
    STUDIO: 'Studio',
    ONE_BHK: '1 BHK',
    TWO_BHK: '2 BHK',
    THREE_BHK: '3 BHK',
    FOUR_BHK: '4 BHK',
    APARTMENT: 'Apartment',
    VILLA: 'Villa',
    TOWNHOUSE: 'Townhouse',
    PENTHOUSE: 'Penthouse',
    PLOT: 'Plot',
    COMMERCIAL: 'Commercial',
  }
  const rawType = snap?.unit?.type ? String(snap.unit.type).toUpperCase() : ''
  const unitType = unitTypeMap[rawType] || (snap?.unit?.type ? String(snap.unit.type).replace(/_/g, ' ') : '—')
  const unitSize = snap?.unit?.size ? String(snap.unit.size) : '—'
  const unitFloor = snap?.unit?.floor !== undefined && snap?.unit?.floor !== null ? String(snap.unit.floor) : '—'
  const unitBedrooms = snap?.unit?.bedrooms !== undefined && snap?.unit?.bedrooms !== null ? String(snap.unit.bedrooms) : '—'
  const unitBathrooms = snap?.unit?.bathrooms !== undefined && snap?.unit?.bathrooms !== null ? String(snap.unit.bathrooms) : '—'

  const defaultCustomerMessage =
    'Taking into consideration your preferences and key investment goals, we have carefully selected the following opportunity that aligns with your criteria and demonstrates exceptional growth potential.'

  // --- Extra Unit Sizes ---
  const lvSize = snap?.unit?.livingAreaSize
  const blSize = snap?.unit?.balconySize
  const trSize = snap?.unit?.terraceSize
  const gySize = snap?.unit?.greenyardSize

  let unitExtraSizesHtml = ''
  if (lvSize || blSize || trSize || gySize) {
    const cols = []
    const vals = []
    if (lvSize) {
      cols.push(`<th style="text-align: left; width: 25%;">Living Area</th>`)
      vals.push(`<td style="text-align: left; font-weight: 500;">${lvSize} m²</td>`)
    }
    if (blSize) {
      cols.push(`<th style="text-align: center; width: 25%;">Balcony</th>`)
      vals.push(`<td style="text-align: center; font-weight: 500;">${blSize} m²</td>`)
    }
    if (trSize) {
      cols.push(`<th style="text-align: center; width: 25%;">Terrace</th>`)
      vals.push(`<td style="text-align: center; font-weight: 500;">${trSize} m²</td>`)
    }
    if (gySize) {
      cols.push(`<th style="text-align: right; width: 25%;">Greenyard</th>`)
      vals.push(`<td style="text-align: right; font-weight: 500;">${gySize} m²</td>`)
    }

    const widthPct = Math.floor(100 / cols.length)
    const headerRow = cols.map((c, idx) => {
      let align = 'center'
      if (idx === 0) align = 'left'
      else if (idx === cols.length - 1) align = 'right'
      return c.replace(/style="text-align: [a-z]+; width: 25%;"/, `style="text-align: ${align}; width: ${widthPct}%;"`)
    }).join('')
    const valueRow = vals.map((v, idx) => {
      let align = 'center'
      if (idx === 0) align = 'left'
      else if (idx === vals.length - 1) align = 'right'
      return v.replace(/style="text-align: [a-z]+; font-weight: 500;"/, `style="text-align: ${align}; font-weight: 500;"`)
    }).join('')

    unitExtraSizesHtml = `
      <table class="table-custom" style="margin-top: 10px;">
        <thead>
          <tr>
            ${headerRow}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${valueRow}
          </tr>
        </tbody>
      </table>
    `
  }

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
    .replace(/{{consultantEmail}}/g, consultantEmail)
    .replace(/{{baseUrl}}/g, baseUrl)
    .replace(/{{paymentPlanName}}/g, proposal.paymentPlanName || 'Standard Plan')
    // Unit Specs
    .replace(/{{unitType}}/g, unitType)
    .replace(/{{type}}/g, unitType)
    .replace(/{{unitSize}}/g, unitSize)
    .replace(/{{size}}/g, unitSize)
    .replace(/{{unitFloor}}/g, unitFloor)
    .replace(/{{floor}}/g, unitFloor)
    .replace(/{{unitBedrooms}}/g, unitBedrooms)
    .replace(/{{bedrooms}}/g, unitBedrooms)
    .replace(/{{unitView}}/g, snap?.unit?.view || '—')
    .replace(/{{view}}/g, snap?.unit?.view || '—')
    .replace(/{{unitBathrooms}}/g, unitBathrooms)
    .replace(/{{bathrooms}}/g, unitBathrooms)
    .replace(/{{deliveryForm}}/g, snap?.unit?.deliveryForm || '—')
    // Dynamic HTML blocks
    .replace(/{{paymentPlanRows}}/g, paymentPlanRows)
    .replace(/{{floorPlanHtml}}/g, floorPlanHtml)
    .replace(/{{amenitiesHtml}}/g, amenitiesHtml)
    .replace(/{{galleryPage}}/g, galleryPageHtml)
    .replace(/{{unitExtraSizesHtml}}/g, unitExtraSizesHtml)
    // Logo: replace any <img> referencing logo-black.svg with inlined base64
    .replace(
      /<img([^>]*?)src=["'][^"']*logo-black\.svg["']([^>]*?)\/?>/gi,
      logoImgTag
    )

  return html
}
