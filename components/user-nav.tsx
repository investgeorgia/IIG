'use client'

import { useState, useRef, useEffect } from 'react'
import { User as UserIcon, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

export function UserNav({ user }: { user: { name: string; email?: string; role?: { name: string } } }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error(e)
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-sm hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
          <UserIcon className="w-4 h-4" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-bold text-neutral-900 leading-none">{user.name}</p>
          <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-wider font-semibold">
            {user.role?.name || 'User'}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
          <div className="px-4 py-2.5 border-b border-neutral-100">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-bold text-neutral-900 truncate mt-0.5">{user.name}</p>
            {user.email && <p className="text-xs text-neutral-500 truncate">{user.email}</p>}
          </div>

          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-neutral-400" />
              Settings & Account
            </Link>
          </div>

          <div className="border-t border-neutral-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
