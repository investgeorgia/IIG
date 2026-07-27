import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'Invest Georgia UAE | Luxury Real Estate & Investment Properties',
  description: 'Discover high-yield real estate investment opportunities in Georgia. Explore luxury apartments, villas, and resort properties in Tbilisi, Batumi, and Gudauri with up to 14% ROI.',
}

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
