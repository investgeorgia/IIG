'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

import { Suspense } from 'react'

function ProjectsList() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const devParam = searchParams.get('developer')
  const developerFilterId = devParam ? Number(devParam) : null

  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [isAdding, setIsAdding] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({
    name: '', developerId: '', address: '', city: '', country: 'Georgia', status: 'PLANNING', completionDate: '', startingPrice: '', roi: ''
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/cms/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
    enabled: hasPermission('Projects', 'VIEW')
  })

  // Filter projects by developerId query param if present
  const filteredProjects = projects ? projects.filter((p: any) => {
    if (developerFilterId) {
      return p.developerId === developerFilterId
    }
    return true
  }) : []

  const searchedProjects = filteredProjects.filter((p: any) => {
    const q = searchQuery.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.developer?.name || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.country || '').toLowerCase().includes(q)
    )
  })

  const activeDeveloperName = filteredProjects.length > 0 && developerFilterId 
    ? filteredProjects[0].developer?.name 
    : 'Developer'

  const { data: developers = [] } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => (await fetch('/api/cms/developers')).json(),
    enabled: hasPermission('Projects', 'EDIT')
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        developerId: Number(form.developerId),
        startingPrice: form.startingPrice ? Number(form.startingPrice) : undefined,
        roi: form.roi ? Number(form.roi) : undefined,
        completionDate: form.completionDate ? form.completionDate : undefined,
        address: form.address || 'TBD', // default to TBD if left empty just in case
      }
      const url = editingProjectId ? `/api/cms/projects/${editingProjectId}` : '/api/cms/projects'
      const method = editingProjectId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to save project')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setForm({ name: '', developerId: '', address: '', city: '', country: 'Georgia', status: 'PLANNING', completionDate: '', startingPrice: '', roi: '' })
      setIsAdding(false)
      setEditingProjectId(null)
      toast.success(editingProjectId ? 'Project updated successfully!' : 'Project created successfully!')
    },
    onError: () => toast.error('Failed to save project')
  })

  const openEdit = (project: any) => {
    setEditingProjectId(project.id)
    setForm({
      name: project.name || '',
      developerId: project.developerId?.toString() || '',
      address: project.address || '',
      city: project.city || '',
      country: project.country || 'Georgia',
      status: project.status || 'PLANNING',
      completionDate: project.completionDate ? new Date(project.completionDate).toISOString().split('T')[0] : '',
      startingPrice: project.startingPrice?.toString() || '',
      roi: project.roi?.toString() || ''
    })
    setIsAdding(true)
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => fetch(`/api/cms/projects/${id}`, { method: 'DELETE' })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSelectedIds([])
      toast.success('Selected projects removed')
    }
  })

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/cms/projects/${id}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to duplicate project')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project duplicated successfully')
    },
    onError: () => toast.error('Failed to duplicate project')
  })

  const toggleSelectAll = () => {
    if (searchedProjects && selectedIds.length === searchedProjects.length) {
      setSelectedIds([])
    } else if (searchedProjects) {
      setSelectedIds(searchedProjects.map((p: any) => p.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>
  
  if (!hasPermission('Projects', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Projects.
      </div>
    )
  }

  const canEdit = hasPermission('Projects', 'EDIT')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Projects</h1>
        <div className="flex flex-wrap gap-2">
          {canEdit && selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => {
              if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected projects?`)) {
                bulkDeleteMutation.mutate(selectedIds)
              }
            }} disabled={bulkDeleteMutation.isPending}>
              {bulkDeleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => { setEditingProjectId(null); setForm({ name: '', developerId: '', address: '', city: '', country: 'Georgia', status: 'PLANNING', completionDate: '', startingPrice: '', roi: '' }); setIsAdding(!isAdding) }} className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </Button>
          )}
        </div>
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">{editingProjectId ? 'Edit Project' : 'New Project'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Project Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Developer *</Label>
                <select value={form.developerId} onChange={e => setForm({ ...form, developerId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm">
                  <option value="">Select Developer...</option>
                  {developers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label>Status *</Label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm">
                  <option value="PLANNING">Planning</option>
                  <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1"><Label>Address *</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Rustaveli Ave" /></div>
              <div className="space-y-1"><Label>City *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div className="space-y-1"><Label>Country *</Label><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></div>
              <div className="space-y-1"><Label>Completion Date</Label><Input type="date" value={form.completionDate} onChange={e => setForm({ ...form, completionDate: e.target.value })} /></div>
              <div className="space-y-1"><Label>Starting Price (USD)</Label><Input type="number" value={form.startingPrice} onChange={e => setForm({ ...form, startingPrice: e.target.value })} /></div>
              <div className="space-y-1"><Label>Expected ROI (%)</Label><Input type="number" step="0.1" value={form.roi} onChange={e => setForm({ ...form, roi: e.target.value })} /></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.developerId || !form.city || !form.country || saveMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editingProjectId ? 'Update Project' : 'Save Project'}
              </Button>
              <Button variant="outline" onClick={() => { setIsAdding(false); setEditingProjectId(null) }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {developerFilterId && (
        <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded-lg text-sm text-neutral-700 w-fit">
          <span>Filtered by Developer: <strong>{activeDeveloperName}</strong></span>
          <Link href="/cms/projects" className="p-0.5 hover:bg-neutral-200 rounded-full">
            <X className="w-3.5 h-3.5 text-neutral-500" />
          </Link>
        </div>
      )}

      <div className="flex items-center gap-2 w-full sm:max-w-sm">
        <Input 
          placeholder="Search projects..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
        />
      </div>

      <Card className="shadow-sm border-neutral-200">
        <CardContent className="p-0 overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500">Loading projects...</div>
          ) : searchedProjects?.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No projects found.</div>
          ) : (
            <div className="w-full">
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-3 p-3 bg-neutral-50/50">
                {searchedProjects?.map((project: any) => {
                  const firstImage = project.media?.find((m: any) => m.type === 'IMAGE' || m.type === 'MASTER_PLAN' || m.type === 'FLOOR_PLAN')?.url || project.coverImageUrl
                  return (
                    <Card key={project.id} className="border border-neutral-100 shadow-sm rounded-xl overflow-hidden bg-white">
                      <CardContent className="p-4 flex gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200/50 flex">
                          {firstImage ? (
                            <img src={firstImage} alt={project.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-neutral-400 font-medium m-auto">No Img</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Link href={`/cms/projects/${project.id}`} className="font-bold text-neutral-900 hover:underline truncate block text-sm">
                            {project.name}
                          </Link>
                          <p className="text-xs text-neutral-500 font-medium">{project.developer?.name || 'Unknown Developer'}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-medium">
                              {project.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-neutral-500">{project.city}</span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="bg-neutral-50 px-4 py-2.5 border-t border-neutral-100 flex justify-between items-center gap-2 text-xs">
                        <div className="flex gap-2">
                          {canEdit && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(project.id)}
                              onChange={() => toggleSelect(project.id)}
                              className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4 my-auto cursor-pointer"
                            />
                          )}
                          <Link href={`/cms/projects/${project.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-neutral-500 hover:text-red-600">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          </Link>
                        </div>
                        <div className="flex gap-1.5">
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-neutral-500 hover:text-green-600"
                                onClick={() => {
                                  if (confirm(`Duplicate project "${project.name}"?`)) {
                                    duplicateMutation.mutate(project.id)
                                  }
                                }}
                                disabled={duplicateMutation.isPending}
                              >
                                <Copy className="w-3.5 h-3.5 mr-1" /> Duplicate
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-neutral-500 hover:text-blue-600" onClick={() => openEdit(project)}>
                                Edit
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                    <tr>
                      {canEdit && (
                        <th className="px-6 py-3 w-12 font-medium">
                          <input type="checkbox" className="rounded border-neutral-300 text-red-600 focus:ring-red-500" 
                            checked={searchedProjects?.length > 0 && selectedIds.length === searchedProjects.length} 
                            onChange={toggleSelectAll} 
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 font-medium w-16">Thumbnail</th>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Developer</th>
                      <th className="px-6 py-3 font-medium">City</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedProjects?.map((project: any) => {
                      const firstImage = project.media?.find((m: any) => m.type === 'IMAGE' || m.type === 'MASTER_PLAN' || m.type === 'FLOOR_PLAN')?.url || project.coverImageUrl
                      return (
                        <tr key={project.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                          {canEdit && (
                            <td className="px-6 py-4">
                              <input type="checkbox" className="rounded border-neutral-300 text-red-600 focus:ring-red-500" 
                                checked={selectedIds.includes(project.id)} 
                                onChange={() => toggleSelect(project.id)} 
                              />
                            </td>
                          )}
                          <td className="px-6 py-4">
                            {firstImage ? (
                              <img src={firstImage} alt={project.name} className="w-10 h-10 object-cover border border-neutral-100 rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center text-[9px] text-neutral-400 font-medium">
                                No Img
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-neutral-900">
                            <Link href={`/cms/projects/${project.id}`} className="text-red-600 hover:underline">
                              {project.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-neutral-500">{project.developer?.name}</td>
                          <td className="px-6 py-4 text-neutral-500">{project.city}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                              {project.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              {canEdit && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-neutral-500 hover:text-green-600 h-8 px-2"
                                    onClick={() => {
                                      if (confirm(`Duplicate project "${project.name}"?`)) {
                                        duplicateMutation.mutate(project.id)
                                      }
                                    }}
                                    disabled={duplicateMutation.isPending}
                                  >
                                    <Copy className="w-4 h-4 mr-1" /> Duplicate
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-blue-600 h-8 px-2" onClick={() => openEdit(project)}>
                                    Edit
                                  </Button>
                                </>
                              )}
                              <Link href={`/cms/projects/${project.id}`}>
                                <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-red-600 h-8 px-2">
                                  <Eye className="w-4 h-4 mr-1" /> View
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Loading projects view...</div>}>
      <ProjectsList />
    </Suspense>
  )
}
