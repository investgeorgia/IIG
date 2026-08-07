import { Sidebar } from '@/components/sidebar'
import { UserNav } from '@/components/user-nav'
import { Bell } from 'lucide-react'
import { getCurrentUser } from '@/server/utils/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden p-4">
      {/* Sidebar Container - Modern floating look */}
      <div className="h-full">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-transparent">
          <div className="flex-1" />
          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 shadow-sm transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <UserNav user={user} />
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}
