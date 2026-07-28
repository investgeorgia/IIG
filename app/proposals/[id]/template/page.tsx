import { ProposalService } from '@/server/services/ProposalService'
import PrintButton from './PrintButton'

const USD_TO_AED = 3.6725

function formatNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default async function ProposalTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const proposal = await ProposalService.getById(id)

  if (!proposal) {
    return <div>Proposal not found</div>
  }

  const snap = proposal.snapshot as any

  // Calculate prices
  const basePrice = Number(snap?.unit?.price || 0)
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

  // Custom payment plan from snapshot
  const customPaymentPlan: { id: number, milestone: string, percentage: number, date: string }[] =
    (snap?.customPaymentPlan && Array.isArray(snap.customPaymentPlan)) ? snap.customPaymentPlan : []

  const amenities: string[] = snap?.amenities || []
  const consultantName = proposal.createdBy?.name || ''
  const consultantPhone = proposal.createdBy?.phone || ''
  const completionDate = snap?.project?.completionDate
    ? new Date(snap.project.completionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  const logoSvg = `
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="4" fill="#c0392b"/>
      <path d="M10 38V10h8l14 18V10h6v28h-8L16 20v18z" fill="white"/>
    </svg>`

  const pageStyle = {
    width: '794px',
    minHeight: '1123px',
    backgroundColor: '#FAFAF8',
    padding: '60px 64px',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    color: '#1a1a1a',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
  }

  const headerSection = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.05em', color: '#1a1a1a' }}>SALES OFFER</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo-black.svg" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} alt="Invest Georgia" crossOrigin="anonymous" />
      </div>
    </div>
  )

  return (
    <div style={{ background: '#f0eeea', padding: '40px 0' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Override Tailwind v4 oklch defaults for html2canvas compatibility */
        *, ::before, ::after {
          border-color: transparent;
          outline-color: transparent;
        }
        body {
          background-color: #f0eeea;
          color: #1a1a1a;
        }
      `}} />

      {/* Manual print button — hidden when printing */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }} className="no-print">
        <PrintButton />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 1 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={pageStyle} className="pdf-page">
        {headerSection}

        {/* Salutation */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700' }}>
            Dear&nbsp;&nbsp;&nbsp;{proposal.customer.name}
          </div>
          {proposal.customerMessage ? (
            <p style={{ fontSize: '12px', color: '#444', marginTop: '8px', lineHeight: '1.7' }}>
              {proposal.customerMessage}
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#444', marginTop: '8px', lineHeight: '1.7' }}>
              Taking into consideration your preferences and the key points we discussed, I have carefully
              selected the following projects that best match your requirements and offer strong investment
              potential.
            </p>
          )}
        </div>

        {/* Project Details Table */}
        <div style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #1a1a1a' }}>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '25%' }}>Project</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '25%' }}>Tower/Block</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '25%' }}>Unit</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '25%' }}>Estimated Completion date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', padding: '12px 6px', fontWeight: '500' }}>{snap?.project?.name || '—'}</td>
                <td style={{ textAlign: 'center', padding: '12px 6px' }}>{snap?.unit?.towerBlock || '—'}</td>
                <td style={{ textAlign: 'center', padding: '12px 6px' }}>{snap?.unit?.unitNumber || '—'}</td>
                <td style={{ textAlign: 'center', padding: '12px 6px' }}>{completionDate || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pricing Table */}
        <div style={{ marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #1a1a1a' }}>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '33%' }}>Selling Price USD</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '33%' }}>Selling Price AED</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', fontWeight: '400', color: '#666', width: '33%' }}>ROI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center', padding: '12px 6px', fontWeight: '500' }}>{formatNum(finalPriceUSD)}</td>
                <td style={{ textAlign: 'center', padding: '12px 6px' }}>{formatNum(finalPriceAED)}</td>
                <td style={{ textAlign: 'center', padding: '12px 6px' }}>{snap?.project?.roi ? `${snap.project.roi}%` : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disclaimer */}
        <div style={{ marginBottom: '28px', fontSize: '11px', color: '#555' }}>
          <div>• Prices and availability are subject to change without prior notice.</div>
          <div>• Completion dates are estimated and may be revised by the developer when required.</div>
        </div>

        {/* Payment Plan Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700' }}>Standard Payment Plan</span>
            {snap?.paymentPlans && snap.paymentPlans.length > 0 && (
              <span style={{ fontSize: '13px', color: '#555' }}>
                {snap.paymentPlans.map((p: any) => p.name).join(', ')}
              </span>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #ddd', borderRadius: '6px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #ccc', backgroundColor: '#f9f9f7' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: '500', width: '6%' }}>#</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: '500', width: '32%' }}>Milestone</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: '500', width: '10%' }}>%</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: '500', width: '20%' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: '500', width: '16%' }}>Amount USD</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: '500', width: '16%' }}>Amount AED</th>
              </tr>
            </thead>
            <tbody>
              {customPaymentPlan.length > 0 ? (
                customPaymentPlan.map((milestone, i) => {
                  const amtUSD = (finalPriceUSD * milestone.percentage) / 100
                  const amtAED = amtUSD * USD_TO_AED
                  return (
                    <tr key={i} style={{ borderBottom: i < customPaymentPlan.length - 1 ? '1px solid #eee' : 'none' }}>
                      <td style={{ padding: '10px 14px', color: '#666' }}>{i + 1}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '500' }}>{milestone.milestone}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>{milestone.percentage}%</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#555' }}>{milestone.date}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatNum(amtUSD)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatNum(amtAED)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 14px', textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>
                    No payment plan milestones entered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 2 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ ...pageStyle, marginTop: '40px', pageBreakBefore: 'always' as const }} className="pdf-page">
        {headerSection}

        {/* Project + Developer Heading */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>{snap?.project?.name || 'Project Name'}</h2>
          {snap?.developer?.name && (
            <span style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>{snap.developer.name}</span>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #ddd' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #ccc', backgroundColor: '#f9f9f7' }}>
                  <th colSpan={3} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: '500', color: '#666' }}>Amenities</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.ceil(amenities.length / 3) }, (_, rowIndex) => (
                  <tr key={rowIndex} style={{ borderBottom: rowIndex < Math.ceil(amenities.length / 3) - 1 ? '1px solid #eee' : 'none' }}>
                    {[0, 1, 2].map(colIndex => {
                      const amenity = amenities[rowIndex * 3 + colIndex]
                      return (
                        <td key={colIndex} style={{ padding: '10px 14px', width: '33%' }}>
                          {amenity || ''}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Unit Condition */}
        {snap?.unit?.condition && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>Unit Condition</span>
            <span style={{ fontSize: '14px', color: '#555' }}>{snap.unit.condition}</span>
          </div>
        )}

        {/* Floor Plan */}
        {snap?.unit?.floorPlanUrl ? (
          <div style={{
            width: '100%', height: '360px', border: '1px solid #ddd', borderRadius: '6px',
            overflow: 'hidden', marginBottom: '36px', backgroundColor: '#f0f0ef'
          }}>
            <img src={snap.unit.floorPlanUrl} alt="Unit Floor Plan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
          </div>
        ) : (
          <div style={{
            width: '100%', height: '360px', border: '1px solid #ddd', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#f0f0ef', marginBottom: '36px', color: '#aaa', fontSize: '13px', fontStyle: 'italic'
          }}>
            No floor plan image available
          </div>
        )}

        {/* Contact Footer */}
        <div style={{ borderTop: '1.5px solid #1a1a1a', paddingTop: '16px', marginTop: 'auto' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Contact</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '12px', lineHeight: '2' }}>
              {consultantName && <div>Sales Consultant: {consultantName}</div>}
              {consultantPhone && <div>Contact: {consultantPhone}</div>}
              <div>Email: info@investgeorgia.ae</div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>
              www.investinggeorgia.ae
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PAGE 3 – PROPERTY IMAGES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedImages.length > 0 && (
        <div style={{ ...pageStyle, marginTop: '40px', pageBreakBefore: 'always' as const }} className="pdf-page">
          {headerSection}

          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', borderBottom: '1.5px solid #1a1a1a', paddingBottom: '10px' }}>
            Property Gallery
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {selectedImages.map((url, i) => (
              <div key={i} style={{
                aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px',
                border: '1px solid #ddd', backgroundColor: '#f0f0ef'
              }}>
                <img src={url} alt={`Property ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; background: white; }
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
