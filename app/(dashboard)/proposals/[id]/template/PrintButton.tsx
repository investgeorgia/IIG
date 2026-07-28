'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => typeof window !== 'undefined' && window.print()}
      style={{
        background: '#c0392b',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 28px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        letterSpacing: '0.02em'
      }}
    >
      🖨️ Print / Save as PDF
    </button>
  )
}
