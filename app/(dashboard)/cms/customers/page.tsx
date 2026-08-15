'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Phone, Mail, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'

const SOURCES = ['Direct', 'Instagram', 'Facebook', 'LinkedIn', 'Referral', 'Walk-in', 'Website', 'Email', 'Other']

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', nationality: '', source: '', notes: '', assignedToId: '' })
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/cms/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      return res.json()
    },
    enabled: hasPermission('Customers', 'VIEW')
  })

  const searchedCustomers = customers.filter((c: any) => {
    const q = searchQuery.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.source || '').toLowerCase().includes(q) ||
      (c.nationality || '').toLowerCase().includes(q)
    )
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/cms/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    enabled: hasPermission('Users', 'VIEW')
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form }
      if (payload.assignedToId) {
        payload.assignedToId = Number(payload.assignedToId) as any
      } else {
        delete (payload as any).assignedToId
      }
      const url = editingId ? `/api/cms/customers/${editingId}` : '/api/cms/customers'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save customer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setForm({ name: '', email: '', phone: '', nationality: '', source: '', notes: '', assignedToId: '' })
      setIsAdding(false)
      setEditingId(null)
      toast.success(editingId ? 'Lead updated' : 'Customer added')
    },
    onError: () => toast.error('Failed to save customer')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/cms/customers/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== deleteMutation.variables))
      toast.success('Lead removed')
    }
  })

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedToId }: { id: number, assignedToId: number | null }) => {
      const res = await fetch(`/api/cms/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId })
      })
      if (!res.ok) throw new Error('Failed to assign lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Lead assigned')
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => fetch(`/api/cms/customers/${id}`, { method: 'DELETE' })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setSelectedIds([])
      toast.success('Selected leads removed')
    }
  })

  const toggleSelectAll = () => {
    if (selectedIds.length === searchedCustomers.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(searchedCustomers.map((c: any) => c.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleEditClick = (customer: any) => {
    setEditingId(customer.id)
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      nationality: customer.nationality || '',
      source: customer.source || '',
      notes: customer.notes || '',
      assignedToId: customer.assignedToId?.toString() || ''
    })
    setIsAdding(true)
  }

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>
  
  if (!hasPermission('Customers', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Leads.
      </div>
    )
  }

  const canEdit = hasPermission('Customers', 'EDIT')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your CRM. Leads are linked to proposals.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => {
              if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected leads?`)) {
                bulkDeleteMutation.mutate(selectedIds)
              }
            }} disabled={bulkDeleteMutation.isPending}>
              {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => {
              if (isAdding && editingId) {
                // if we are editing, clicking this resets to clean add state
                setEditingId(null)
                setForm({ name: '', email: '', phone: '', nationality: '', source: '', notes: '', assignedToId: '' })
              } else {
                setIsAdding(!isAdding)
              }
            }} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" /> {editingId ? 'Add Instead' : isAdding ? 'Close Panel' : 'Add Lead'}
            </Button>
          )}
        </div>
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">{editingId ? 'Edit Lead' : 'New Customer'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Full Name *</Label><Input placeholder="Ahmed Al-Rashidi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" placeholder="ahmed@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input placeholder="+971 50 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Nationality</Label><Input placeholder="UAE" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
              <div className="space-y-1"><Label>Lead Source</Label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                  <option value="">Select source...</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {hasPermission('Users', 'VIEW') && (
                <div className="space-y-1"><Label>Assign To</Label>
                  <select value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                    <option value="">Unassigned</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1"><Label>Notes</Label><Input placeholder="Any notes about this lead..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Customer
              </Button>
              <Button variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', email: '', phone: '', nationality: '', source: '', notes: '', assignedToId: '' }) }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 w-full sm:max-w-sm">
        <Input 
          placeholder="Search leads..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" /></div>
          ) : searchedCustomers.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No customers found.</div>
          ) : (
            <div className="w-full">
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3 p-3 bg-neutral-50/50">
                {searchedCustomers.map((c: any) => (
                  <Card key={c.id} className="border border-neutral-100 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-neutral-900 text-sm">{c.name}</span>
                          {c.nationality && <span className="text-[10px] text-neutral-400 ml-1.5">({c.nationality})</span>}
                        </div>
                        {c.source && (
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] rounded-full font-medium">
                            {c.source}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-xs text-neutral-600 pt-1">
                        {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</div>}
                        {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{c.phone}</div>}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                        <span className="text-neutral-500 font-medium">Proposals: <strong className="text-neutral-800">{c._count?.proposals || 0}</strong></span>
                        {hasPermission('Users', 'VIEW') && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-neutral-400">Owner:</span>
                            <select
                              value={c.assignedToId || ''}
                              onChange={(e) => assignMutation.mutate({ id: c.id, assignedToId: e.target.value ? Number(e.target.value) : null })}
                              disabled={assignMutation.isPending}
                              className="text-[11px] font-semibold rounded border border-neutral-200 bg-white px-1.5 py-0.5 outline-none cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-100 flex justify-between items-center gap-2 text-xs">
                      <div className="flex gap-2">
                        {canEdit && (
                          <input type="checkbox" className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4 my-auto cursor-pointer" 
                            checked={selectedIds.includes(c.id)} 
                            onChange={() => toggleSelect(c.id)} 
                          />
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {canEdit ? (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700" onClick={() => handleEditClick(c)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-neutral-400 hover:text-red-600" onClick={() => {
                              if (confirm(`Are you sure you want to delete customer "${c.name}"?`)) {
                                deleteMutation.mutate(c.id)
                              }
                            }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-neutral-400 text-xs">Read-only</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                    <tr>
                      {canEdit && (
                        <th className="px-6 py-3 w-12">
                          <input type="checkbox" className="rounded border-neutral-300 text-red-600 focus:ring-red-500" 
                            checked={searchedCustomers.length > 0 && selectedIds.length === searchedCustomers.length} 
                            onChange={toggleSelectAll} 
                          />
                        </th>
                      )}
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Nationality</th>
                      <th className="px-6 py-3">Source</th>
                      {hasPermission('Users', 'VIEW') && <th className="px-6 py-3">Assigned To</th>}
                      <th className="px-6 py-3">Proposals</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedCustomers.map((c: any) => (
                      <tr key={c.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                        {canEdit && (
                          <td className="px-6 py-4">
                            <input type="checkbox" className="rounded border-neutral-300 text-red-600 focus:ring-red-500" 
                              checked={selectedIds.includes(c.id)} 
                              onChange={() => toggleSelect(c.id)} 
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 font-medium text-neutral-900">{c.name}</td>
                        <td className="px-6 py-4 text-neutral-600">
                          <div className="space-y-0.5">
                            {c.email && <div className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" />{c.email}</div>}
                            {c.phone && <div className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3" />{c.phone}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-600">{c.nationality || '—'}</td>
                        <td className="px-6 py-4">
                          {c.source ? <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">{c.source}</span> : '—'}
                        </td>
                        {hasPermission('Users', 'VIEW') && (
                          <td className="px-6 py-4">
                            <select
                              value={c.assignedToId || ''}
                              onChange={(e) => assignMutation.mutate({ id: c.id, assignedToId: e.target.value ? Number(e.target.value) : null })}
                              disabled={assignMutation.isPending}
                              className="text-xs font-semibold rounded border px-2 py-1 outline-none appearance-none cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          </td>
                        )}
                        <td className="px-6 py-4 text-neutral-600 font-medium">{c._count?.proposals || 0}</td>
                        <td className="px-6 py-4 text-right">
                          {canEdit ? (
                            <div className="flex justify-end items-center gap-2">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8 px-2" onClick={() => handleEditClick(c)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600 h-8 w-8" onClick={() => {
                                if (confirm(`Are you sure you want to delete customer "${c.name}"?`)) {
                                  deleteMutation.mutate(c.id)
                                }
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-xs">Read-only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
