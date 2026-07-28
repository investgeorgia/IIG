'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Triggers window.print() when ?print=1 is in the URL.
 * Used for PDF generation: the proposal page opens the template with ?print=1,
 * the browser's native print dialog appears, and the user saves as PDF.
 */
export default function PrintTrigger() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('print') === '1') {
      // Small delay to ensure images/fonts are loaded
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  return null
}
