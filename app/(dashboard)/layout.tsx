import { Sidebar } from '@/components/sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { getCurrentUser } from '@/server/utils/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-[#F4F7FE] overflow-hidden p-2 sm:p-4">
      {/* Sidebar Container - Desktop */}
      <div className="h-full">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Responsive Header */}
        <DashboardHeader user={user} />
        
        {/* Page Content */}
        <div className="flex-1 px-3 sm:px-6 md:px-8 pb-4 sm:pb-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  )
}
