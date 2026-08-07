'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, FileText, Download, Loader2, Trash2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePermissions } from '@/hooks/usePermissions'

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-neutral-100 text-neutral-600 border-neutral-200',
  SENT:     'bg-blue-50 text-blue-700 border-blue-100',
  VIEWED:   'bg-amber-50 text-amber-700 border-amber-100',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
}

const ALL_STATUSES = ['ALL', 'DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED']

export default function ProposalsPage() {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [search, setSearch] = useState('')

  const { hasPermission } = usePermissions()
  const canViewUsers = hasPermission('Users', 'VIEW')

  const [activeAgent, setActiveAgent] = useState('ALL')

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/cms/users')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: canViewUsers
  })

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals', activeAgent],
    queryFn: async () => {
      const url = activeAgent !== 'ALL' ? `/api/proposals?agentId=${activeAgent}` : '/api/proposals'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const generatePdfMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/proposals/${id}/pdf`, { method: 'POST' })
      if (!res.ok) throw new Error('PDF generation failed')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      window.open(data.pdfUrl, '_blank')
      toast.success('PDF generated!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Proposal deleted')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Status updated')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} proposal(s)?`)) return
    for (const id of selectedIds) {
      await fetch(`/api/proposals/${id}`, { method: 'DELETE' })
    }
    queryClient.invalidateQueries({ queryKey: ['proposals'] })
    setSelectedIds([])
    toast.success('Proposals deleted')
  }

  // Filter logic
  const filtered = useMemo(() => {
    return proposals.filter((p: any) => {
      const matchStatus = activeStatus === 'ALL' || p.status === activeStatus
      const q = search.toLowerCase()
      const matchSearch = !q ||
        p.customer?.name?.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        p.createdBy?.name?.toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [proposals, activeStatus, search])

  // Status counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: proposals.length }
    for (const s of ALL_STATUSES.slice(1)) {
      c[s] = proposals.filter((p: any) => p.status === s).length
    }
    return c
  }, [proposals])

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((p: any) => p.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {proposals.length} total proposal{proposals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.length})
            </Button>
          )}
          <Link href="/proposals/new">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" /> New Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Search + Status Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <Input
            placeholder="Search by customer, agent, ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {canViewUsers && (
          <div className="w-full sm:max-w-[200px]">
            <select
              value={activeAgent}
              onChange={(e) => setActiveAgent(e.target.value)}
              className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ALL">All Agents</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1 max-w-full">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setActiveStatus(s); setSelectedIds([]) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
                activeStatus === s
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="ml-1.5 opacity-70">({counts[s] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm border-neutral-200 overflow-hidden">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">
                {proposals.length === 0 ? 'No proposals yet' : 'No matching proposals'}
              </p>
              <p className="text-sm text-neutral-400 mb-4">
                {proposals.length === 0 ? 'Create your first proposal to get started' : 'Try adjusting the filters'}
              </p>
              {proposals.length === 0 && (
                <Link href="/proposals/new">
                  <Button className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-2" />New Proposal</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead className="text-xs text-neutral-400 bg-neutral-50 border-b border-neutral-100 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-neutral-300 text-red-600 focus:ring-red-500"
                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Agent</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map((p: any) => (
                    <tr key={p.id} className={`transition-colors ${selectedIds.includes(p.id) ? 'bg-red-50/40' : 'hover:bg-neutral-50/70'}`}>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-neutral-300 text-red-600 focus:ring-red-500"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/proposals/${p.id}`} className="font-mono text-xs text-neutral-500 hover:text-blue-600 transition-colors">
                          #{String(p.id).padStart(4, '0')}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-neutral-900 leading-tight">{p.customer?.name}</p>
                        {p.customer?.email && (
                          <p className="text-xs text-neutral-400 mt-0.5">{p.customer.email}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-neutral-600 text-sm">{p.createdBy?.name ?? '—'}</td>
                      <td className="px-5 py-4">
                        <select
                          value={p.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: p.id, status: e.target.value })}
                          disabled={updateStatusMutation.isPending}
                          className={`text-xs font-semibold rounded-full border px-2 py-1 appearance-none cursor-pointer outline-none ${STATUS_COLORS[p.status] ?? ''}`}
                        >
                          {ALL_STATUSES.slice(1).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-neutral-400 text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/proposals/${p.id}`}>
                            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-red-600 h-8 px-2">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost" size="sm"
                            className="text-neutral-500 hover:text-red-600 h-8 px-2"
                            onClick={() => generatePdfMutation.mutate(p.id)}
                            disabled={generatePdfMutation.isPending}
                            title="Generate PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-neutral-300 hover:text-red-600 h-8 px-2"
                            onClick={() => { if (confirm('Delete this proposal?')) deleteMutation.mutate(p.id) }}
                            disabled={deleteMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}