'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Building2, Home, Users, LogOut, LayoutDashboard, Star, ShieldCheck, UserCircle, FileText, Settings, PanelLeft, FileCode } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { usePermissions } from '@/hooks/usePermissions'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { hasPermission, isLoading } = usePermissions()

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

  // Default Dashboard and Proposals to always show unless we have specific rules for them.
  // Actually, we can just say if module doesn't match an existing restricted module, it falls back to Role default or we just let it pass if hasPermission allows it.
  // Wait, for Dashboard and Proposals, `hasPermission` will return true for Admin, and true for Sales/Marketing because they fall under "other modules".
  
  return (
    <aside className="w-64 h-full bg-white rounded-3xl shadow-sm hidden md:flex flex-col overflow-hidden relative">
      <div className="h-24 flex items-center px-8">
        <div className="flex items-center gap-2">
          <Image src="/logo-black.svg" alt="IIG Logo" width={100} height={32} priority className="h-8 w-auto object-contain" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 custom-scrollbar">
        <>
            {/* Main Section */}
            {mainNav.filter(item => hasPermission(item.module, 'VIEW')).length > 0 && (
              <div>
                <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Main</p>
                <nav className="space-y-1">
                  {mainNav.filter(item => hasPermission(item.module, 'VIEW')).map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href} 
                        className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                          isActive 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
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

            {/* CMS Section */}
            {cmsNav.filter(item => hasPermission(item.module, 'VIEW')).length > 0 && (
              <div>
                <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Catalog</p>
                <nav className="space-y-1">
                  {cmsNav.filter(item => hasPermission(item.module, 'VIEW')).map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href} 
                        className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                          isActive 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
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
            {settingsNav.filter(item => hasPermission(item.module, 'VIEW')).length > 0 && (
              <div>
                <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Setting</p>
                <nav className="space-y-1">
                  {settingsNav.filter(item => hasPermission(item.module, 'VIEW')).map((item) => {
                    const Icon = item.icon
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link 
                        key={item.name} 
                        href={item.href} 
                        className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                          isActive 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
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
          </>
      </div>
      
      <div className="p-4 mb-2">
        <button 
          onClick={() => logoutMutation.mutate()}
          className="flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-600" />
          Sign-Out
        </button>
      </div>
    </aside>
  )
}
