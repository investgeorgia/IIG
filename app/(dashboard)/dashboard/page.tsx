'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, LayoutDashboard, FileText, TrendingUp, TrendingDown, Clock, Minus, Home } from 'lucide-react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-neutral-100 text-neutral-600',
  SENT:     'bg-blue-50 text-blue-600',
  VIEWED:   'bg-amber-50 text-amber-600',
  ACCEPTED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-600',
}

function TrendBadge({ pct }: { pct: number }) {
  if (pct > 0) return (
    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md font-semibold text-xs">
      +{pct}% <TrendingUp className="w-3 h-3" />
    </span>
  )
  if (pct < 0) return (
    <span className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-md font-semibold text-xs">
      {pct}% <TrendingDown className="w-3 h-3" />
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md font-semibold text-xs">
      0% <Minus className="w-3 h-3" />
    </span>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to load stats')
      return res.json()
    },
    retry: 1,
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm font-medium">Loading dashboard stats...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

        {/* Total Customers */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100 flex flex-col justify-between min-h-[170px] sm:h-48 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <p className="font-bold text-neutral-700 text-sm">Total Customers</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900">{stats?.customers?.total ?? '—'}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-400">+{stats?.customers?.newLast30 ?? 0} in last 30 days</span>
            <TrendBadge pct={stats?.customers?.percentChange ?? 0} />
          </div>
        </div>

        {/* Proposals Sent */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100 flex flex-col justify-between min-h-[170px] sm:h-48 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
            <p className="font-bold text-neutral-700 text-sm">Proposals Sent</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900">{stats?.proposals?.total ?? '—'}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-400">+{stats?.proposals?.newLast30 ?? 0} in last 30 days</span>
            <TrendBadge pct={stats?.proposals?.percentChange ?? 0} />
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100 flex flex-col justify-between min-h-[170px] sm:h-48 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <p className="font-bold text-neutral-700 text-sm">Active Projects</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900">{stats?.projects?.active ?? '—'}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-400">+{stats?.projects?.newLast30 ?? 0} in last 30 days</span>
            <TrendBadge pct={stats?.projects?.percentChange ?? 0} />
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100 flex flex-col justify-between min-h-[170px] sm:h-48 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Home className="w-5 h-5" />
            </div>
            <p className="font-bold text-neutral-700 text-sm">Total Units</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900">{stats?.units?.total ?? '—'}</p>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-neutral-400">+{stats?.units?.newLast30 ?? 0} in last 30 days</span>
            <TrendBadge pct={stats?.units?.percentChange ?? 0} />
          </div>
        </div>

      </div>

      {/* Recent Proposals Table */}
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-neutral-100 overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900">Recent Proposals Generated</h2>
          <Link href="/proposals" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            See All Proposals →
          </Link>
        </div>

        <div className="overflow-x-auto">
          {!stats?.recentProposals || stats.recentProposals.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No proposals yet. <Link href="/proposals/new" className="text-blue-600 hover:underline">Create your first one.</Link></p>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-neutral-400 bg-[#F8FAFC] font-semibold">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Proposal ID</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProposals.map((p: any, i: number) => (
                  <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-5 font-bold text-neutral-900">{i + 1}</td>
                    <td className="px-6 py-5 font-mono text-neutral-500 text-xs">
                      <Link href={`/proposals/${p.id}`} className="hover:text-blue-600 transition-colors">
                        #{String(p.id).padStart(4, '0')}
                      </Link>
                    </td>
                    <td className="px-6 py-5 font-semibold text-neutral-700">{p.customer?.name ?? '—'}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${STATUS_COLORS[p.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-semibold text-neutral-600">{p.createdBy?.name ?? '—'}</td>
                    <td className="px-6 py-5 text-neutral-500 font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}