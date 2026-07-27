'use client'

import { usePermissions } from '@/hooks/usePermissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, ExternalLink, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StaticPageItem {
  name: string
  slug: string
  createdAt: string
  description: string
  type: 'Public' | 'Admin Only' | 'System'
}

const staticPagesList: StaticPageItem[] = [
  {
    name: 'IIG Project Portfolio',
    slug: '/iigprojects',
    createdAt: '2026-07-27',
    description: 'Luxury Real Estate & Investment Properties Showcase with interactive carousels and slideshows.',
    type: 'Public'
  },
  {
    name: 'Homepage / Portal',
    slug: '/',
    createdAt: '2026-07-24',
    description: 'Main landing page / entry portal for the application.',
    type: 'Public'
  },
  {
    name: 'Dashboard Overview',
    slug: '/dashboard',
    createdAt: '2026-07-24',
    description: 'Administrative stats panel and core system hub.',
    type: 'Admin Only'
  },
  {
    name: 'CMS Projects Manager',
    slug: '/cms/projects',
    createdAt: '2026-07-24',
    description: 'Manage details, completion dates, prices, and metrics for investment projects.',
    type: 'Admin Only'
  },
  {
    name: 'CMS Developers Manager',
    slug: '/cms/developers',
    createdAt: '2026-07-24',
    description: 'Manage real estate developers profiles and links.',
    type: 'Admin Only'
  },
  {
    name: 'Proposal Builder',
    slug: '/proposals',
    createdAt: '2026-07-24',
    description: 'Create and generate customer-tailored proposals.',
    type: 'Admin Only'
  }
]

export default function PagesCmsPage() {
  const { hasPermission, isLoading } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !hasPermission('Pages', 'VIEW')) {
      router.push('/dashboard')
    }
  }, [isLoading, hasPermission, router])

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (!hasPermission('Pages', 'VIEW')) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Site Pages</h1>
        <p className="text-sm text-neutral-500">
          Overview and listing of pages in the current application.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              A directory of public-facing and system pages currently configured.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Page Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Slug</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Date Created</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Visibility</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staticPagesList.map((page) => (
                  <tr key={page.slug} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-900 text-sm">{page.name}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{page.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-neutral-600">
                      {page.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {page.createdAt}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.type === 'Public' 
                          ? 'bg-green-50 text-green-700 border border-green-200/50' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                      }`}>
                        {page.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={page.slug} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
