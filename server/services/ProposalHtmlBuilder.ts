/**
 * Shared helper: takes a proposal and returns fully-rendered HTML.
 *
 * - If the proposal has a template (stored HTML), it substitutes all
 *   {{placeholders}} including the inlined SVG logo and gallery page.
 * - Otherwise falls back to generateSalesOfferHtml().
 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { generateSalesOfferHtml } from './SalesOfferHtmlService'

function getLogoSvgDataUri(): string {
  const logoPath = path.join(process.cwd(), 'public', 'logo-black.svg')
  if (!existsSync(logoPath)) return ''
  const svgContent = readFileSync(logoPath, 'utf-8')
  const b64 = Buffer.from(svgContent).toString('base64')
  return `data:image/svg+xml;base64,${b64}`
}

function buildGalleryPageHtml(
  selectedImages: string[],
  headerHtml: string
): string {
  if (selectedImages.length === 0) return ''

  const galleryImages = selectedImages
    .map(
      (url) =>
        `<div style="aspect-ratio:16/9;overflow:hidden;border-radius:6px;border:1px solid #ddd;background:#f0f0ef;">
           <img src="${url}" style="width:100%;height:100%;object-fit:cover;" />
         </div>`
    )
    .join('')

  return `
    <div style="width:794px;min-height:1123px;background:#FAFAF8;padding:60px 64px;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;box-sizing:border-box;page-break-before:always;">
      ${headerHtml}
      <h2 style="font-size:16px;font-weight:700;margin-bottom:20px;border-bottom:1.5px solid #1a1a1a;padding-bottom:10px;">Property Gallery</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        ${galleryImages}
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

  // Inline the logo as a base64 data URI so Puppeteer doesn't need network access
  const logoDataUri = getLogoSvgDataUri()
  const logoImgTag = logoDataUri
    ? `<img src="${logoDataUri}" style="height:45px;width:auto;object-fit:contain;" alt="Invest Georgia" />`
    : `<img src="${baseUrl}/logo-black.svg" style="height:45px;width:auto;object-fit:contain;" alt="Invest Georgia" />`

  // Build header HTML for gallery page
  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
      <div style="font-size:22px;font-weight:800;letter-spacing:0.05em;color:#1a1a1a;">SALES OFFER</div>
      <div style="display:flex;align-items:center;">${logoImgTag}</div>
    </div>`

  // Build gallery page HTML from selected images
  const galleryPageHtml = buildGalleryPageHtml(selectedImages, headerHtml)

  // Substitute all placeholders in the stored template content
  let html = proposal.template.content
    // Core data
    .replace(/{{customerName}}/g, proposal.customer?.name || '')
    .replace(/{{unitNumber}}/g, snap?.unit?.unitNumber || '')
    .replace(/{{towerBlock}}/g, snap?.unit?.towerBlock || '—')
    .replace(/{{projectName}}/g, snap?.project?.name || '')
    .replace(/{{baseUrl}}/g, baseUrl)
    // Logo replacement — replace any <img> referencing logo-black.svg with the inlined version
    .replace(
      /<img([^>]*?)src=["'][^"']*logo-black\.svg["']([^>]*?)\/>/gi,
      logoImgTag
    )
    .replace(
      /<img([^>]*?)src=["'][^"']*logo-black\.svg["']([^>]*?)>/gi,
      logoImgTag
    )
    // Gallery page — inject before </body> if placeholder exists, or append
    .replace(/{{galleryPage}}/g, galleryPageHtml)

  // If no {{galleryPage}} placeholder was in the template, append gallery before </body>
  if (!proposal.template.content.includes('{{galleryPage}}') && galleryPageHtml) {
    html = html.replace('</body>', `${galleryPageHtml}\n</body>`)
  }

  return html
}
