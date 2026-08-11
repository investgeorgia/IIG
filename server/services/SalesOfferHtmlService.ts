/**
 * Generates the full HTML for a Sales Offer PDF directly server-side,
 * bypassing any auth middleware. Used by the PDF generation route.
 */

const USD_TO_AED = 3.6725

function formatNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function generateSalesOfferHtml(proposal: any, baseUrl: string = ''): string {
  const snap = proposal.snapshot as any

  // Calculate prices
  const basePrice = Number(snap.unit.price)
  const discountAmount = proposal.discountPercent ? basePrice * (proposal.discountPercent / 100) : 0
  const finalPriceNum = proposal.customPrice ? Number(proposal.customPrice) : (basePrice - discountAmount)
  const finalPriceUSD = finalPriceNum
  const finalPriceAED = finalPriceNum * USD_TO_AED

  // Safe parse selectedImages
  let selectedImages: string[] = []
  const rawImgs = proposal.selectedImages
  if (Array.isArray(rawImgs)) {
    selectedImages = rawImgs as string[]
  } else if (typeof rawImgs === 'string') {
    try { selectedImages = JSON.parse(rawImgs) } catch {}
  }
  if (!Array.isArray(selectedImages)) selectedImages = []

  const customPaymentPlan: { milestone: string, percentage: number, date: string }[] =
    (snap.customPaymentPlan && Array.isArray(snap.customPaymentPlan)) ? snap.customPaymentPlan : []

  const amenities: string[] = snap.amenities || []
  const consultantName = proposal.createdBy?.name || ''
  const consultantPhone = proposal.createdBy?.phone || ''
  const customHandoverVal = proposal.handover || snap.unit?.handover
  const completionDate = customHandoverVal
    ? new Date(customHandoverVal).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : (snap.project.completionDate
      ? new Date(snap.project.completionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : '')

  let visibleFields: string[] = ['building', 'renovationPrice']
  if (proposal.visibleFields) {
    try {
      visibleFields = typeof proposal.visibleFields === 'string' ? JSON.parse(proposal.visibleFields) : proposal.visibleFields
    } catch {}
  }

  const showBuilding = visibleFields.includes('building') && snap.unit?.building
  const showRenovation = visibleFields.includes('renovationPrice') && snap.unit?.renovationPrice

  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
      <div style="font-size:22px;font-weight:800;letter-spacing:0.05em;color:#1a1a1a;">SALES OFFER</div>
      <div style="display:flex;align-items:center;">
        <img src="${baseUrl}/logo-black.svg" style="height:45px;width:auto;object-fit:contain;" alt="Invest Georgia" />
      </div>
    </div>`

  // Payment plan rows
  const paymentPlanRows = customPaymentPlan.length > 0
    ? customPaymentPlan.map((m, i) => {
        const amtUSD = (finalPriceUSD * m.percentage) / 100
        const amtAED = amtUSD * USD_TO_AED
        return `
          <tr style="border-bottom:${i < customPaymentPlan.length - 1 ? '1px solid #eee' : 'none'}">
            <td style="padding:10px 14px;color:#666;">${i + 1}</td>
            <td style="padding:10px 14px;font-weight:500;">${m.milestone}</td>
            <td style="padding:10px 14px;text-align:center;">${m.percentage}%</td>
            <td style="padding:10px 14px;text-align:center;color:#555;">${m.date}</td>
            <td style="padding:10px 14px;text-align:right;">${formatNum(amtUSD)}</td>
            <td style="padding:10px 14px;text-align:right;">${formatNum(amtAED)}</td>
          </tr>`
      }).join('')
    : `<tr><td colspan="6" style="padding:60px 14px;text-align:center;color:#aaa;font-style:italic;">No payment plan milestones entered</td></tr>`

  // Amenities rows (3 per row)
  const amenityRows = amenities.length > 0 ? (() => {
    let rows = ''
    for (let r = 0; r < Math.ceil(amenities.length / 3); r++) {
      const isLast = r === Math.ceil(amenities.length / 3) - 1
      rows += `<tr style="border-bottom:${isLast ? 'none' : '1px solid #eee'};">`
      for (let c = 0; c < 3; c++) {
        const a = amenities[r * 3 + c] || ''
        rows += `<td style="padding:10px 14px;width:33%;">${a}</td>`
      }
      rows += '</tr>'
    }
    return rows
  })() : ''

  // Floor plan
  const floorPlanHtml = snap.unit?.floorPlanUrl
    ? `<div style="width:100%;height:360px;border:1px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:36px;background:#f0f0ef;">
         <img src="${snap.unit.floorPlanUrl}" style="width:100%;height:100%;object-fit:contain;" />
       </div>`
    : `<div style="width:100%;height:200px;border:1px solid #ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#f0f0ef;margin-bottom:36px;color:#aaa;font-size:13px;font-style:italic;">No floor plan image available</div>`

  // Gallery page
  const galleryImages = selectedImages.map(url =>
    `<div style="aspect-ratio:16/9;overflow:hidden;border-radius:6px;border:1px solid #ddd;background:#f0f0ef;">
       <img src="${url}" style="width:100%;height:100%;object-fit:cover;" />
     </div>`
  ).join('')

  const galleryPage = selectedImages.length > 0 ? `
    <div style="width:794px;min-height:1123px;background:#FAFAF8;padding:60px 64px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;box-sizing:border-box;page-break-before:always;">
      ${headerHtml}
      <h2 style="font-size:16px;font-weight:700;margin-bottom:20px;border-bottom:1.5px solid #1a1a1a;padding-bottom:10px;">Property Gallery</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        ${galleryImages}
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Offer - ${proposal.customer.name}</title>
  ${baseUrl ? `<base href="${baseUrl}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f0eeea; }
    @media print {
      @page { size: A4; margin: 0; }
      body { background: white; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page" style="width:794px;min-height:1123px;background:#FAFAF8;padding:60px 64px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;box-sizing:border-box;">
  ${headerHtml}

  <!-- Salutation -->
  <div style="margin-bottom:20px;">
    <div style="font-size:16px;font-weight:700;">Dear&nbsp;&nbsp;&nbsp;${proposal.customer.name}</div>
    <p style="font-size:12px;color:#444;margin-top:8px;line-height:1.7;">
      ${proposal.customerMessage || 'Taking into consideration your preferences and the key points we discussed, I have carefully selected the following projects that best match your requirements and offer strong investment potential.'}
    </p>
  </div>

  <!-- Project Table -->
  <div style="margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="border-bottom:1.5px solid #1a1a1a;">
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;">Project</th>
          ${showBuilding ? `<th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;">Building</th>` : ''}
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;">Tower/Block</th>
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;">Unit</th>
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;">Estimated Completion date</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;padding:12px 6px;font-weight:500;">${snap.project.name}</td>
          ${showBuilding ? `<td style="text-align:center;padding:12px 6px;">${snap.unit.building}</td>` : ''}
          <td style="text-align:center;padding:12px 6px;">${snap.unit.towerBlock || '—'}</td>
          <td style="text-align:center;padding:12px 6px;">${snap.unit.unitNumber}</td>
          <td style="text-align:center;padding:12px 6px;">${completionDate || '—'}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Pricing Table -->
  <div style="margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="border-bottom:1.5px solid #1a1a1a;">
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;width:33%;">Selling Price USD</th>
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;width:33%;">Selling Price AED</th>
          <th style="text-align:center;padding:8px 6px;font-weight:400;color:#666;width:33%;">ROI</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align:center;padding:12px 6px;font-weight:500;">${formatNum(finalPriceUSD)}</td>
          <td style="text-align:center;padding:12px 6px;">${formatNum(finalPriceAED)}</td>
          <td style="text-align:center;padding:12px 6px;">${snap.project.roi ? snap.project.roi + '%' : '—'}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Disclaimer -->
  <div style="margin-bottom:28px;font-size:11px;color:#555;">
    <div>• Prices and availability are subject to change without prior notice.</div>
    <div>• Completion dates are estimated and may be revised by the developer when required.</div>
  </div>

  <!-- Payment Plan -->
  <div>
    <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:12px;">
      <span style="font-size:15px;font-weight:700;">Standard Payment Plan</span>
      ${snap.paymentPlans?.length ? `<span style="font-size:13px;color:#555;">${snap.paymentPlans.map((p: any) => p.name).join(', ')}</span>` : ''}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #ddd;border-radius:6px;">
      <thead>
        <tr style="border-bottom:1.5px solid #ccc;background:#f9f9f7;">
          <th style="text-align:left;padding:10px 14px;font-weight:500;width:6%;">#</th>
          <th style="text-align:left;padding:10px 14px;font-weight:500;width:32%;">Milestone</th>
          <th style="text-align:center;padding:10px 14px;font-weight:500;width:10%;">%</th>
          <th style="text-align:center;padding:10px 14px;font-weight:500;width:20%;">Date</th>
          <th style="text-align:right;padding:10px 14px;font-weight:500;width:16%;">Amount USD</th>
          <th style="text-align:right;padding:10px 14px;font-weight:500;width:16%;">Amount AED</th>
        </tr>
      </thead>
      <tbody>
        ${paymentPlanRows}
      </tbody>
    </table>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page" style="width:794px;min-height:1123px;background:#FAFAF8;padding:60px 64px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;box-sizing:border-box;page-break-before:always;">
  ${headerHtml}

  <!-- Project + Developer -->
  <div style="display:flex;align-items:baseline;gap:20px;margin-bottom:24px;">
    <h2 style="font-size:22px;font-weight:800;margin:0;">${snap.project.name}</h2>
    ${snap.developer?.name ? `<span style="font-size:14px;color:#555;font-weight:500;">${snap.developer.name}</span>` : ''}
  </div>

  <!-- Amenities -->
  ${amenities.length > 0 ? `
  <div style="margin-bottom:28px;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #ddd;">
      <thead>
        <tr style="border-bottom:1.5px solid #ccc;background:#f9f9f7;">
          <th colspan="3" style="text-align:left;padding:10px 14px;font-weight:500;color:#666;">Amenities</th>
        </tr>
      </thead>
      <tbody>${amenityRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Unit Condition -->
  ${snap.unit?.condition ? `
  <div style="display:flex;gap:16px;align-items:baseline;margin-bottom:20px;">
    <span style="font-size:14px;font-weight:700;">Unit Condition</span>
    <span style="font-size:14px;color:#555;">${snap.unit.condition}</span>
  </div>` : ''}

  <!-- Renovation Price Option -->
  ${showRenovation ? `
  <div style="display:flex;gap:16px;align-items:baseline;margin-bottom:20px;">
    <span style="font-size:14px;font-weight:700;">Renovation Option</span>
    <span style="font-size:14px;color:#555;">$${Number(snap.unit.renovationPrice).toLocaleString()} USD ${snap.unit.renovationPriceSqm ? `($${Number(snap.unit.renovationPriceSqm).toLocaleString()} / m²)` : ''}</span>
  </div>` : ''}

  <!-- Floor Plan -->
  ${floorPlanHtml}

  <!-- Contact -->
  <div style="border-top:1.5px solid #1a1a1a;padding-top:16px;">
    <div style="font-size:16px;font-weight:800;margin-bottom:8px;">Contact</div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div style="font-size:12px;line-height:2;">
        ${consultantName ? `<div>Sales Consultant: ${consultantName}</div>` : ''}
        ${consultantPhone ? `<div>Contact: ${consultantPhone}</div>` : ''}
        <div>Email: ${proposal.createdBy?.email || 'info@investgeorgia.ae'}</div>
      </div>
      <div style="font-size:13px;font-weight:600;">www.investingeorgia.ae</div>
    </div>
  </div>
</div>

<!-- PAGE 3 (Gallery) -->
${galleryPage}

</body>
</html>`
}
