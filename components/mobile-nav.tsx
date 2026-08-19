'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  UserCircle,
  FileText,
  Users,
  Building2,
  LayoutDashboard,
  FileCode,
  Star,
  ShieldCheck,
  Settings,
  LogOut,
  X
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const lastPathname = useRef(pathname)

  // Close drawer only when route actually changes
  useEffect(() => {
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname
      onClose()
    }
  }, [pathname, onClose])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (!res.ok) throw new Error('Logout failed')
    },
    onSuccess: () => {
      router.push('/login')
    },
    onError: () => {
      toast.error('Failed to logout')
    }
  })

  const mainNav = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, module: 'Dashboard' },
    { name: 'Leads', href: '/cms/customers', icon: UserCircle, module: 'Customers' },
    { name: 'Proposals', href: '/proposals', icon: FileText, module: 'Proposals' },
  ]

  const cmsNav = [
    { name: 'Developers', href: '/cms/developers', icon: Users, module: 'Developers' },
    { name: 'Project Portfolio', href: '/cms/project-portfolio', icon: Building2, module: 'Projects' },
    { name: 'Projects', href: '/cms/projects', icon: LayoutDashboard, module: 'Projects' },
    { name: 'Templates', href: '/cms/templates', icon: FileCode, module: 'Templates' },
    { name: 'Amenities', href: '/cms/amenities', icon: Star, module: 'Amenities' },
    { name: 'Pages', href: '/cms/pages', icon: FileText, module: 'Pages' },
    { name: 'Salespersons', href: '/cms/salespersons', icon: Users, module: 'Salespersons' },
    { name: 'Analytics', href: '/cms/analytics', icon: LayoutDashboard, module: 'Analytics' },
  ]

  const settingsNav = [
    { name: 'Users', href: '/cms/users', icon: ShieldCheck, module: 'Users' },
    { name: 'Settings', href: '/settings', icon: Settings, module: 'Settings' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <aside className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-100">
          <Image
            src="/logo-black.svg"
            alt="IIG Logo"
            width={100}
            height={32}
            priority
            className="h-7 w-auto object-contain"
          />
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
          {/* Main Section */}
          {mainNav.filter((item) => hasPermission(item.module, 'VIEW')).length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Main</p>
              <nav className="space-y-1">
                {mainNav
                  .filter((item) => hasPermission(item.module, 'VIEW'))
                  .map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center px-3.5 py-3 text-sm font-semibold rounded-xl transition-all ${
                          isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-neutral-400'}`} />
                        {item.name}
                      </Link>
                    )
                  })}
              </nav>
            </div>
          )}

          {/* Catalog Section */}
          {cmsNav.filter((item) => hasPermission(item.module, 'VIEW')).length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Catalog</p>
              <nav className="space-y-1">
                {cmsNav
                  .filter((item) => hasPermission(item.module, 'VIEW'))
                  .map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center px-3.5 py-3 text-sm font-semibold rounded-xl transition-all ${
                          isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-neutral-400'}`} />
                        {item.name}
                      </Link>
                    )
                  })}
              </nav>
            </div>
          )}

          {/* Settings Section */}
          {settingsNav.filter((item) => hasPermission(item.module, 'VIEW')).length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Settings</p>
              <nav className="space-y-1">
                {settingsNav
                  .filter((item) => hasPermission(item.module, 'VIEW'))
                  .map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center px-3.5 py-3 text-sm font-semibold rounded-xl transition-all ${
                          isActive
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-neutral-400'}`} />
                        {item.name}
                      </Link>
                    )
                  })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={() => {
              onClose()
              logoutMutation.mutate()
            }}
            className="flex items-center w-full px-3.5 py-3 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 text-red-600" />
            Sign-Out
          </button>
        </div>
      </aside>
    </div>
  )
}
