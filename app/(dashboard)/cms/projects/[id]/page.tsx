'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Calendar, Globe, Loader2, Plus, Trash2, Upload, X, CheckSquare, Square, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { usePermissions } from '@/hooks/usePermissions'

const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-50 text-blue-700',
  UNDER_CONSTRUCTION: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
}

const UNIT_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-50 text-green-700',
  RESERVED: 'bg-amber-50 text-amber-700',
  SOLD: 'bg-red-50 text-red-700',
}

const UNIT_TYPE_LABELS: Record<string, string> = {
  STUDIO: 'Studio',
  ONE_BHK: '1 BHK',
  TWO_BHK: '2 BHK',
  THREE_BHK: '3 BHK',
  FOUR_BHK: '4 BHK',
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  TOWNHOUSE: 'Townhouse',
  PENTHOUSE: 'Penthouse',
  PLOT: 'Plot',
  COMMERCIAL: 'Commercial',
}

const MEDIA_TABS = ['IMAGE', 'FLOOR_PLAN', 'BROCHURE', 'MASTER_PLAN', 'DOCUMENT', 'PRESENTATION']

type Tab = 'overview' | 'units' | 'amenities' | 'payment-plans' | 'media'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [mediaType, setMediaType] = useState('IMAGE')
  const [uploading, setUploading] = useState(false)
  const [unitFloorPlanUploading, setUnitFloorPlanUploading] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [planUnitId, setPlanUnitId] = useState<number | null>(null)
  const [planSchedule, setPlanSchedule] = useState<{milestone: string, percentage: string, date: string}[]>([])
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([])

  // -- Queries --
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}`)
      if (!res.ok) throw new Error('Failed to load project')
      return res.json()
    }
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units', id],
    queryFn: async () => (await fetch(`/api/cms/projects/${id}/units`)).json()
  })

  const { data: allAmenities = [] } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => (await fetch('/api/cms/amenities')).json()
  })

  const { data: projectAmenities = [] } = useQuery({
    queryKey: ['project-amenities', id],
    queryFn: async () => (await fetch(`/api/cms/projects/${id}/amenities`)).json()
  })

  const { data: paymentPlans = [] } = useQuery({
    queryKey: ['payment-plans', id],
    queryFn: async () => (await fetch(`/api/cms/projects/${id}/payment-plans`)).json()
  })

  const { data: mediaFiles = [] } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => (await fetch(`/api/cms/projects/${id}/media`)).json()
  })

  // -- Derived --
  const linkedAmenityIds = new Set(projectAmenities.map((pa: any) => pa.amenityId))

  // -- Mutations --
  const toggleAmenityMutation = useMutation({
    mutationFn: async (amenityId: number) => {
      const newIds = linkedAmenityIds.has(amenityId)
        ? [...linkedAmenityIds].filter(id => id !== amenityId)
        : [...linkedAmenityIds, amenityId]
      await fetch(`/api/cms/projects/${id}/amenities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenityIds: newIds })
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-amenities', id] })
  })

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      await fetch(`/api/cms/units/${unitId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', id] })
      toast.success('Unit deleted')
    }
  })

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}/payment-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: planName, 
          description: planDesc, 
          unitId: planUnitId || undefined,
          schedule: planSchedule.map(s => ({
            milestone: s.milestone,
            percentage: Number(s.percentage),
            date: s.date
          }))
        })
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans', id] })
      setPlanName('')
      setPlanDesc('')
      setPlanUnitId(null)
      setPlanSchedule([])
      setShowAddPlan(false)
      toast.success('Payment plan added')
    }
  })

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await fetch(`/api/cms/payment-plans/${planId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans', id] })
      toast.success('Payment plan removed')
    }
  })

  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      await fetch(`/api/cms/media/${mediaId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', id] })
      toast.success('File deleted')
    }
  })

  const togglePublishMutation = useMutation({
    mutationFn: async (currentlyPublished: boolean) => {
      const res = await fetch(`/api/cms/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentlyPublished })
      })
      if (!res.ok) throw new Error('Failed to update project status')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Project visibility updated')
    }
  })

  // -- Unit add form state --
  const { register: regUnit, handleSubmit: handleUnit, reset: resetUnit, setValue: setUnitValue } = useForm()

  const createUnitMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        projectId: Number(id),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        size: Number(data.size),
        price: Number(data.price),
        floor: data.floor ? Number(data.floor) : undefined,
        status: data.status || 'AVAILABLE'
      }
      
      const res = await fetch(editingUnit ? `/api/cms/units/${editingUnit.id}` : '/api/cms/units', {
        method: editingUnit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', id] })
      resetUnit()
      setShowAddUnit(false)
      setEditingUnit(null)
      toast.success(editingUnit ? 'Unit updated' : 'Unit added')
    }
  })

  const openEditUnit = (unit: any) => {
    setEditingUnit(unit)
    resetUnit({
      unitNumber: unit.unitNumber,
      type: unit.type,
      status: unit.status,
      view: unit.view || '',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      floor: unit.floor || '',
      size: unit.size,
      price: unit.price,
      floorPlanUrl: unit.floorPlanUrl || ''
    })
    setShowAddUnit(true)
  }

  const handleUnitFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUnitFloorPlanUploading(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'FLOOR_PLAN')
      formData.append('projectId', id)
      const uploadRes = await fetch('/api/uploads', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()
      setUnitValue('floorPlanUrl', url)
      toast.success('Floor plan uploaded')
    } catch (err: any) {
      toast.error('Failed to upload floor plan')
    } finally {
      setUnitFloorPlanUploading(false)
      e.target.value = ''
    }
  }

  // -- File Upload --
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', mediaType)
        formData.append('projectId', id)
        const uploadRes = await fetch('/api/uploads', { method: 'POST', body: formData })
        if (!uploadRes.ok) { toast.error(`Failed: ${file.name}`); continue }
        const { url, name, size, mimeType } = await uploadRes.json()
        await fetch(`/api/cms/projects/${id}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: mediaType, url, name, size, mimeType })
        })
      }
      queryClient.invalidateQueries({ queryKey: ['media', id] })
      toast.success('Files uploaded')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (permissionsLoading || isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
  }

  if (!hasPermission('Projects', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Projects.
      </div>
    )
  }

  const canEdit = hasPermission('Projects', 'EDIT')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'units', label: 'Units', count: units.length },
    { id: 'amenities', label: 'Amenities', count: linkedAmenityIds.size },
    { id: 'payment-plans', label: 'Payment Plans', count: paymentPlans.length },
    { id: 'media', label: 'Media', count: mediaFiles.length },
  ]

  const filteredMedia = mediaFiles.filter((m: any) => m.type === mediaType)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-neutral-500">
        <Link href="/cms/projects" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Projects
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">{project?.name}</span>
      </div>

      {/* Project Header */}
      <Card className="shadow-sm border-neutral-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{project?.name}</h1>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[project?.status] || ''}`}>
                  {project?.status?.replace('_', ' ')}
                </span>
                {project?.isPublished ? (
                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">Published</span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full font-medium bg-neutral-100 text-neutral-600">Draft</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-500 flex-wrap">
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {project?.developer?.name}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {project?.city}, {project?.country}</span>
                {project?.completionDate && (
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(project.completionDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                )}
                {project?.roi && (
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> ROI: {project.roi}%</span>
                )}
              </div>
              {project?.startingPrice && (
                <p className="text-sm font-semibold text-neutral-800">
                  Starting from {Number(project.startingPrice).toLocaleString()} USD
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 md:items-center">
              {canEdit && (
                <Button 
                  variant={project?.isPublished ? 'outline' : 'default'}
                  className={!project?.isPublished ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                  onClick={() => togglePublishMutation.mutate(project?.isPublished)}
                  disabled={togglePublishMutation.isPending}
                >
                  {togglePublishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {project?.isPublished ? 'Unpublish Project' : 'Publish Project'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-0 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── TAB: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Total Units</p>
              <p className="text-3xl font-bold">{units.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Available</p>
              <p className="text-3xl font-bold text-green-600">{units.filter((u: any) => u.status === 'AVAILABLE').length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-1">
              <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Sold</p>
              <p className="text-3xl font-bold text-red-600">{units.filter((u: any) => u.status === 'SOLD').length}</p>
            </CardContent>
          </Card>
          {project?.description && (
            <div className="md:col-span-3">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-sm font-medium text-neutral-500 uppercase">Description</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-neutral-700 leading-relaxed">{project.description}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: UNITS ─── */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Button onClick={() => { setEditingUnit(null); resetUnit(); setShowAddUnit(!showAddUnit) }} className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" /> Add Unit
              </Button>
            )}
          </div>

          {showAddUnit && canEdit && (
            <Card className="shadow-sm border-red-100">
              <CardHeader><CardTitle className="text-lg">{editingUnit ? 'Edit Unit' : 'New Unit'}</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleUnit((data) => createUnitMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1"><Label>Unit Number *</Label><Input placeholder="A-101" {...regUnit('unitNumber', { required: true })} /></div>
                    <div className="space-y-1"><Label>Type *</Label>
                      <select {...regUnit('type', { required: true })} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                        <option value="">Select...</option>
                        {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1"><Label>Status</Label>
                      <select {...regUnit('status')} defaultValue="AVAILABLE" className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                        <option value="AVAILABLE">Available</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="SOLD">Sold</option>
                      </select>
                    </div>
                    <div className="space-y-1"><Label>View</Label><Input placeholder="Sea View" {...regUnit('view')} /></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="space-y-1"><Label>Bedrooms *</Label><Input type="number" min={0} {...regUnit('bedrooms', { required: true })} /></div>
                    <div className="space-y-1"><Label>Bathrooms *</Label><Input type="number" min={0} {...regUnit('bathrooms', { required: true })} /></div>
                    <div className="space-y-1"><Label>Floor</Label><Input type="number" min={0} {...regUnit('floor')} /></div>
                    <div className="space-y-1"><Label>Size (m²) *</Label><Input type="number" step="0.01" {...regUnit('size', { required: true })} /></div>
                    <div className="space-y-1"><Label>Price (USD) *</Label><Input type="number" step="0.01" {...regUnit('price', { required: true })} /></div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-1">
                      <Label>Floor Plan URL</Label>
                      <div className="flex gap-2">
                        <Input placeholder="https://..." {...regUnit('floorPlanUrl')} className="flex-1" />
                        <input type="file" id="unit-floor-upload" className="hidden" accept="image/*" onChange={handleUnitFloorPlanUpload} />
                        <label htmlFor="unit-floor-upload" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-sm">
                          {unitFloorPlanUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={createUnitMutation.isPending} className="bg-red-600 hover:bg-red-700">
                      {createUnitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editingUnit ? 'Update Unit' : 'Save Unit'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setShowAddUnit(false); setEditingUnit(null); resetUnit() }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardContent className="p-0">
              {units.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">No units yet. Add the first one.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                    <tr>
                      <th className="px-6 py-3">Unit #</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Floor</th>
                      <th className="px-6 py-3">Beds/Baths</th>
                      <th className="px-6 py-3">Size (m²)</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit: any) => (
                      <tr key={unit.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          {unit.unitNumber}
                          {unit.floorPlanUrl && <a href={unit.floorPlanUrl} target="_blank" rel="noreferrer" className="block text-[10px] text-blue-600 hover:underline mt-1">View Plan</a>}
                        </td>
                        <td className="px-6 py-4 text-neutral-600">{UNIT_TYPE_LABELS[unit.type] || unit.type?.toLowerCase()}</td>
                        <td className="px-6 py-4 text-neutral-600">{unit.floor ?? '—'}</td>
                        <td className="px-6 py-4 text-neutral-600">{unit.bedrooms} / {unit.bathrooms}</td>
                        <td className="px-6 py-4 text-neutral-600">{Number(unit.size).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium">{Number(unit.price).toLocaleString()} {unit.currency}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${UNIT_STATUS_COLORS[unit.status]}`}>{unit.status}</span></td>
                        <td className="px-6 py-4 text-right flex justify-end gap-1">
                          {canEdit ? (
                            <>
                              <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-blue-600 h-8 px-2" onClick={() => openEditUnit(unit)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-red-600 h-8 px-2" onClick={() => deleteUnitMutation.mutate(unit.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
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
      )}

      {/* ─── TAB: AMENITIES ─── */}
      {activeTab === 'amenities' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">Click any amenity to toggle it for this project. Manage your global amenity library in <Link href="/cms/amenities" className="text-red-600 underline">Settings → Amenities</Link>.</p>
          {allAmenities.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-8 text-center text-neutral-500">
                No amenities created yet. <Link href="/cms/amenities" className="text-red-600 underline">Create amenities first</Link>.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allAmenities.map((amenity: any) => {
                const isLinked = linkedAmenityIds.has(amenity.id)
                return (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenityMutation.mutate(amenity.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      isLinked
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-xl">{amenity.icon || '●'}</span>
                    <span className="text-sm font-medium">{amenity.name}</span>
                    {isLinked ? <CheckSquare className="w-4 h-4 ml-auto text-red-500" /> : <Square className="w-4 h-4 ml-auto text-neutral-300" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: PAYMENT PLANS ─── */}
      {activeTab === 'payment-plans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Button onClick={() => setShowAddPlan(true)} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-2" /> Add Plan</Button>
            )}
          </div>
          {showAddPlan && canEdit && (
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">New Payment Plan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1"><Label>Plan Name *</Label><Input placeholder='e.g. "40/60 Plan"' value={planName} onChange={e => setPlanName(e.target.value)} /></div>
                <div className="space-y-1"><Label>Description</Label><Input placeholder="e.g. 40% on booking, 60% on handover" value={planDesc} onChange={e => setPlanDesc(e.target.value)} /></div>
                
                <div className="space-y-1">
                  <Label>Assign to Unit (Optional)</Label>
                  <select
                    value={planUnitId || ''}
                    onChange={e => setPlanUnitId(e.target.value ? Number(e.target.value) : null)}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Apply to entire Project</option>
                    {units.map((u: any) => (
                      <option key={u.id} value={u.id}>Unit {u.unitNumber} ({u.type})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Schedule Details</Label>
                  {planSchedule.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                      <Input placeholder="Milestone Name (e.g. Down Payment)" value={item.milestone} onChange={e => {
                        const newSch = [...planSchedule]
                        newSch[index].milestone = e.target.value
                        setPlanSchedule(newSch)
                      }} />
                      <Input type="number" placeholder="%" value={item.percentage} className="w-24" onChange={e => {
                        const newSch = [...planSchedule]
                        newSch[index].percentage = e.target.value
                        setPlanSchedule(newSch)
                      }} />
                      <Input placeholder="Date (e.g. On Booking)" value={item.date} className="w-48" onChange={e => {
                        const newSch = [...planSchedule]
                        newSch[index].date = e.target.value
                        setPlanSchedule(newSch)
                      }} />
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setPlanSchedule(planSchedule.filter((_, i) => i !== index))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPlanSchedule([...planSchedule, { milestone: '', percentage: '', date: '' }])} className="w-full border-dashed">
                    <Plus className="w-4 h-4 mr-2" /> Add Milestone
                  </Button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => createPlanMutation.mutate()} disabled={!planName || createPlanMutation.isPending} className="bg-red-600 hover:bg-red-700">Save</Button>
                  <Button variant="outline" onClick={() => { setShowAddPlan(false); setPlanSchedule([]); }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {paymentPlans.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">No payment plans added.</div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {paymentPlans.map((plan: any) => (
                    <div key={plan.id} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-900">{plan.name}</p>
                          {plan.unitId && (
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium border border-blue-200">
                              Unit {units.find((u: any) => u.id === plan.unitId)?.unitNumber || plan.unitId}
                            </span>
                          )}
                        </div>
                        {plan.description && <p className="text-sm text-neutral-500 mt-0.5">{plan.description}</p>}
                        {plan.schedule && Array.isArray(plan.schedule) && plan.schedule.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {plan.schedule.map((s: any, i: number) => (
                              <div key={i} className="text-xs flex gap-4 text-neutral-600 bg-white border border-neutral-100 p-1.5 rounded">
                                <span className="font-medium w-32">{s.milestone || s.label}</span>
                                <span className="text-blue-600 w-12">{s.percentage}%</span>
                                <span>{s.date || (s.dueDays ? `Due in ${s.dueDays} days` : '')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600" onClick={() => deletePlanMutation.mutate(plan.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB: MEDIA ─── */}
      {activeTab === 'media' && (() => {
        const filteredMedia = mediaFiles.filter((m: any) => m.type === mediaType)
        const selectedCount = selectedMediaIds.length

        const toggleSelectAll = () => {
          if (selectedCount === filteredMedia.length) {
            setSelectedMediaIds([])
          } else {
            setSelectedMediaIds(filteredMedia.map((m: any) => m.id))
          }
        }

        const toggleSelectMedia = (id: number) => {
          setSelectedMediaIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
          )
        }

        const handleBulkDelete = async () => {
          if (!confirm(`Are you sure you want to delete ${selectedCount} file(s)?`)) return
          try {
            const res = await fetch('/api/cms/media/bulk-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: selectedMediaIds })
            })
            if (!res.ok) throw new Error('Bulk delete failed')
            toast.success('Files deleted successfully')
            setSelectedMediaIds([])
            queryClient.invalidateQueries({ queryKey: ['media', id] })
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete files')
          }
        }

        const handleBulkDownload = async () => {
          const selectedFiles = mediaFiles.filter((m: any) => selectedMediaIds.includes(m.id))
          if (selectedFiles.length === 0) return

          // Download each file individually by creating a temporary link
          selectedFiles.forEach((file: any) => {
            const link = document.createElement('a')
            link.href = file.url
            link.download = file.name || file.url.split('/').pop() || 'download'
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          })
          toast.success('Downloads triggered')
        }

        // Return thumbnail/icon based on MIME type or tab type
        const renderThumbnail = (file: any) => {
          const isImg = file.mimeType?.startsWith('image/') || file.type === 'IMAGE' || file.type === 'FLOOR_PLAN' || file.type === 'MASTER_PLAN'
          if (isImg) {
            return (
              <div className="relative w-full h-full bg-neutral-100">
                <img
                  src={file.url}
                  alt={file.name || 'media'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
                {/* Fallback shown when image fails to load */}
                <div className="absolute inset-0 hidden flex-col items-center justify-center p-4 text-center bg-neutral-100">
                  <span className="text-4xl mb-2">🖼️</span>
                  <p className="text-xs font-semibold text-neutral-700 line-clamp-1 px-2">Image</p>
                  <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2 break-all px-2">{file.name}</p>
                </div>
              </div>
            )
          }

          // Use generic icons for non-image files
          let icon = '📄'
          let label = 'File'
          if (file.type === 'BROCHURE') { icon = '📖'; label = 'Brochure' }
          else if (file.type === 'PRESENTATION') { icon = '📊'; label = 'Presentation' }
          else if (file.type === 'DOCUMENT') { icon = '📝'; label = 'Document' }

          return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-neutral-100">
              <span className="text-4xl mb-2">{icon}</span>
              <p className="text-xs font-semibold text-neutral-700 line-clamp-1 px-2">{label}</p>
              <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2 break-all px-2">{file.name}</p>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            {/* Media type sub-tabs */}
            <div className="flex gap-2 flex-wrap">
              {MEDIA_TABS.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setMediaType(type)
                    setSelectedMediaIds([]) // Clear selection when switching tabs
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mediaType === type ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Bulk actions and multi-select bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-media"
                  className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4"
                  checked={filteredMedia.length > 0 && selectedCount === filteredMedia.length}
                  onChange={toggleSelectAll}
                />
                <label htmlFor="select-all-media" className="text-sm font-medium text-neutral-700 select-none cursor-pointer">
                  Select All ({filteredMedia.length})
                </label>
              </div>

              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                    <Download className="w-4 h-4 mr-1.5" /> Download ({selectedCount})
                  </Button>
                  {canEdit && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> Delete ({selectedCount})
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Upload zone */}
            {canEdit && (
              <Card className="shadow-sm border-2 border-dashed border-neutral-200 hover:border-red-300 transition-colors">
                <CardContent className="p-8 text-center">
                  <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    {uploading ? (
                      <><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /><p className="text-sm text-neutral-500">Uploading...</p></>
                    ) : (
                      <><Upload className="w-8 h-8 text-neutral-400" /><p className="text-sm font-medium text-neutral-700">Click to upload {mediaType.replace('_', ' ').toLowerCase()}s</p><p className="text-xs text-neutral-400">Images, PDFs, Documents, Presentations, Spreadsheets (Max 50MB)</p></>
                    )}
                  </label>
                </CardContent>
              </Card>
            )}

            {/* Media grid */}
            {filteredMedia.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((file: any) => {
                  const isSelected = selectedMediaIds.includes(file.id)
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleSelectMedia(file.id)}
                      className={`group relative rounded-xl overflow-hidden border bg-neutral-50 aspect-square cursor-pointer transition-all ${isSelected ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-200 hover:border-neutral-300'}`}
                    >
                      {/* Checkbox badge */}
                      <div className={`absolute top-2 left-2 z-10 flex items-center justify-center rounded-md border h-5 w-5 bg-white transition-opacity ${isSelected ? 'border-red-500 opacity-100' : 'border-neutral-300 opacity-0 group-hover:opacity-100'}`}>
                        {isSelected && <span className="text-red-600 font-bold text-xs">✓</span>}
                      </div>

                      {/* File Rendering */}
                      {renderThumbnail(file)}

                      {/* Individual Actions (Hover) */}
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={file.url}
                          download={file.name || 'download'}
                          onClick={e => e.stopPropagation()}
                          className="bg-white hover:bg-neutral-100 text-neutral-700 rounded-lg p-1.5 shadow-md border border-neutral-200"
                          title="Download"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Delete this file?')) deleteMediaMutation.mutate(file.id)
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 shadow-md"
                            title="Delete"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {filteredMedia.length === 0 && <p className="text-center text-sm text-neutral-400 py-4">No {mediaType.replace('_', ' ').toLowerCase()}s uploaded yet.</p>}
          </div>
        )
      })()}
    </div>
  )
}
