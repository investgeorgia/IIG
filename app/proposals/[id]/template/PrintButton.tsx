'use client'

import { useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export default function PrintButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1') {
      // Small delay to ensure images/fonts are loaded
      const timer = setTimeout(() => {
        generatePDF()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const generatePDF = async () => {
    if (typeof window === 'undefined') return
    setIsGenerating(true)

    try {
      const pages = document.querySelectorAll('.pdf-page')
      if (pages.length === 0) return

      const pdf = new jsPDF('p', 'pt', 'a4')
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement
        const canvas = await html2canvas(pageEl, {
          scale: 2, // Higher quality
          useCORS: true, // Allow loading external images
          logging: false
        })

        const imgData = canvas.toDataURL('image/jpeg', 1.0)
        
        // A4 size in pt is 595.28 x 841.89
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        
        if (i > 0) pdf.addPage()
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      }

      pdf.save('proposal.pdf')
    } catch (error: any) {
      console.error('Failed to generate PDF:', error)
      alert(`Failed to generate PDF: ${error.message || String(error)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      style={{
        background: '#c0392b',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 28px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: isGenerating ? 'not-allowed' : 'pointer',
        letterSpacing: '0.02em',
        opacity: isGenerating ? 0.7 : 1
      }}
    >
      {isGenerating ? '⏳ Generating PDF...' : '🖨️ Download as PDF'}
    </button>
  )
}
