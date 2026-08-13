'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'

const CATEGORIES = ['RECREATION', 'WELLNESS', 'SECURITY', 'CONNECTIVITY', 'TRANSPORT', 'RETAIL', 'OTHER']

const CATEGORY_ICONS: Record<string, string> = {
  RECREATION: '🏊', WELLNESS: '💆', SECURITY: '🔒',
  CONNECTIVITY: '📶', TRANSPORT: '🚗', RETAIL: '🛍️', OTHER: '⭐'
}

export default function AmenitiesPage() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [isAdding, setIsAdding] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [category, setCategory] = useState('OTHER')
  const [filterCat, setFilterCat] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)

  const { data: amenities = [], isLoading } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const res = await fetch('/api/cms/amenities')
      if (!res.ok) throw new Error('Failed to fetch amenities')
      return res.json()
    },
    enabled: hasPermission('Amenities', 'VIEW')
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cms/amenities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon: icon || undefined, category })
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] })
      setName(''); setIcon(''); setCategory('OTHER')
      setIsAdding(false)
      toast.success('Amenity created')
    },
    onError: () => toast.error('Failed to create amenity')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/cms/amenities/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] })
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== selectedIds.find(id => id === selectedId)))
      toast.success('Amenity deleted')
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cms/amenities/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (!res.ok) throw new Error('Failed to bulk delete')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['amenities'] })
      setSelectedIds([])
      toast.success(`Successfully deleted ${data.count} amenities`)
    },
    onError: () => toast.error('Failed to bulk delete amenities')
  })

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setBulkUploading(true)
    try {
      const file = files[0]
      const text = await file.text()
      const res = await fetch('/api/cms/amenities/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Bulk upload failed')
      }
      const data = await res.json()
      toast.success(`Successfully imported ${data.count} amenities`)
      queryClient.invalidateQueries({ queryKey: ['amenities'] })
    } catch (err: any) {
      toast.error(err.message || 'Bulk upload failed')
    } finally {
      setBulkUploading(false)
      e.target.value = ''
    }
  }

  const toggleSelectAll = (filteredAmenities: any[]) => {
    const filteredIds = filteredAmenities.map(a => a.id)
    const allSelected = filteredIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)))
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])))
    }
  }

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const grouped = (filterCat === 'ALL' ? amenities : amenities.filter((a: any) => a.category === filterCat))

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>
  
  if (!hasPermission('Amenities', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Amenities.
      </div>
    )
  }

  const canEdit = hasPermission('Amenities', 'EDIT')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Amenities</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage the global amenity library. Link amenities to projects from the project detail page.</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="bulk-amenity-upload"
              className="hidden"
              accept=".txt"
              onChange={handleBulkUpload}
              disabled={bulkUploading}
            />
            <label
              htmlFor="bulk-amenity-upload"
              className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              {bulkUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Bulk Upload (.txt)
            </label>
            <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" /> Add Amenity
            </Button>
          </div>
        )}
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">New Amenity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input placeholder="e.g. Swimming Pool" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Icon (emoji)</Label>
                <Input placeholder="e.g. 🏊" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0)+c.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => createMutation.mutate()} disabled={!name || createMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIds.length > 0 && canEdit && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm text-red-800 font-semibold">{selectedIds.length} amenities selected</span>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`Are you sure you want to delete these ${selectedIds.length} amenities?`)) {
                bulkDeleteMutation.mutate()
              }
            }}
            disabled={bulkDeleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {bulkDeleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete Selected
          </Button>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterCat === cat ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
            {cat === 'ALL' ? 'All' : `${CATEGORY_ICONS[cat]} ${cat.charAt(0)+cat.slice(1).toLowerCase()}`}
          </button>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" /></div>
          ) : grouped.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No amenities found. Add one above.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                <tr>
                  {canEdit && (
                    <th className="px-6 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={grouped.length > 0 && grouped.every((a: any) => selectedIds.includes(a.id))}
                        onChange={() => toggleSelectAll(grouped)}
                        className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3">Icon</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((amenity: any) => (
                  <tr key={amenity.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                    {canEdit && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(amenity.id)}
                          onChange={() => toggleSelectOne(amenity.id)}
                          className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 text-xl">{amenity.icon || CATEGORY_ICONS[amenity.category]}</td>
                    <td className="px-6 py-4 font-medium text-neutral-900">{amenity.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full font-medium capitalize">
                        {amenity.category.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canEdit ? (
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600" onClick={() => {
                          if (confirm('Are you sure you want to delete this amenity?')) {
                            deleteMutation.mutate(amenity.id)
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-neutral-400 text-xs">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
