'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, Bell } from 'lucide-react'
import { UserNav } from '@/components/user-nav'
import { MobileNav } from '@/components/mobile-nav'

export function DashboardHeader({ user }: { user: { name: string; email?: string; role?: { name: string } } }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="h-16 md:h-20 flex items-center justify-between px-3 sm:px-6 md:px-8 bg-transparent">
        {/* Mobile Hamburger & Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image
            src="/logo-black.svg"
            alt="IIG Logo"
            width={90}
            height={28}
            priority
            className="h-6 w-auto object-contain"
          />
        </div>

        <div className="hidden md:block flex-1" />

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 shadow-sm transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <UserNav user={user} />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  )
}
