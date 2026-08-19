'use client'

import { useState, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Loader2, Building2, MapPin, Calendar, Globe, Trash2, Edit3, Image as ImageIcon, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'

function ProjectPortfolioContent() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()

  const [isAdding, setIsAdding] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [form, setForm] = useState({
    name: '',
    slug: '',
    developerId: '',
    address: '',
    city: 'Tbilisi',
    country: 'Georgia',
    status: 'PLANNING',
    completionDate: '',
    startingPrice: '',
    roi: '',
    projectType: 'Apartments',
    startingPriceText: '',
    paymentPlanText: '',
    sizeText: '',
    roiText: '',
    completionText: '',
    isPublished: true
  })

  // Fetch developers for project creation select
  const { data: developers = [] } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => (await fetch('/api/cms/developers')).json(),
    enabled: hasPermission('Projects', 'VIEW')
  })

  // Fetch projects list
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['portfolio-projects'],
    queryFn: async () => {
      const res = await fetch('/api/cms/portfolio-projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
    enabled: hasPermission('Projects', 'VIEW')
  })

  const searchedProjects = projects.filter((p: any) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.projectType || '').toLowerCase().includes(q)
    )
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        location: form.city || form.address || 'Tbilisi',
        isPublished: form.isPublished
      }
      const url = editingProjectId ? `/api/cms/portfolio-projects/${editingProjectId}` : '/api/cms/portfolio-projects'
      const method = editingProjectId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save portfolio project')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-projects'] })
      setForm({
        name: '', slug: '', developerId: '', address: '', city: 'Tbilisi', country: 'Georgia', status: 'PLANNING', completionDate: '', startingPrice: '', roi: '', projectType: 'Apartments', startingPriceText: '', paymentPlanText: '', sizeText: '', roiText: '', completionText: '', isPublished: true
      })
      setIsAdding(false)
      setEditingProjectId(null)
      toast.success(editingProjectId ? 'Portfolio project updated!' : 'New portfolio project created!')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save project')
  })

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: number; isPublished: boolean }) => {
      const res = await fetch(`/api/cms/portfolio-projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished })
      })
      if (!res.ok) throw new Error('Failed to update status')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-projects'] })
      toast.success('Project status updated')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/cms/portfolio-projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-projects'] })
      toast.success('Project deleted')
    }
  })

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading permissions...</div>

  if (!hasPermission('Projects', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Project Portfolio.
      </div>
    )
  }

  const canEdit = hasPermission('Projects', 'EDIT')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Project Portfolio</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage showcase projects, media galleries, and specifications for the public <strong>/iigprojects</strong> page.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setEditingProjectId(null)
              setForm({
                name: '', slug: '', developerId: developers[0]?.id?.toString() || '', address: '', city: 'Tbilisi', country: 'Georgia', status: 'PLANNING', completionDate: '', startingPrice: '', roi: '', projectType: '2-4 Bedroom Apartments', startingPriceText: '', paymentPlanText: '', sizeText: '', roiText: '', completionText: '', isPublished: true
              })
              setIsAdding(!isAdding)
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Portfolio Project
          </Button>
        )}
      </div>

      {/* Add / Edit Form Card */}
      {isAdding && canEdit && (
        <Card className="shadow-md border-neutral-200">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold">{editingProjectId ? 'Edit Portfolio Project' : 'New Portfolio Project'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Project Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Kavataradze"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Project Slug (URL &amp; Media Folder)</Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. kavtaradze"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Developer *</Label>
                <select
                  value={form.developerId}
                  onChange={e => setForm({ ...form, developerId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Select Developer...</option>
                  {developers.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location / City *</Label>
                <Input
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Tbilisi"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Project Type</Label>
                <Input
                  value={form.projectType}
                  onChange={e => setForm({ ...form, projectType: e.target.value })}
                  placeholder="e.g. 2-4 Bedroom Apartments"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Starting Price Display</Label>
                <Input
                  value={form.startingPriceText}
                  onChange={e => setForm({ ...form, startingPriceText: e.target.value })}
                  placeholder="e.g. $140,000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Payment Plan Display</Label>
                <Input
                  value={form.paymentPlanText}
                  onChange={e => setForm({ ...form, paymentPlanText: e.target.value })}
                  placeholder="e.g. 15 / 10 / 75"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Size Display</Label>
                <Input
                  value={form.sizeText}
                  onChange={e => setForm({ ...form, sizeText: e.target.value })}
                  placeholder="e.g. From 54.2 m²"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">ROI Display</Label>
                <Input
                  value={form.roiText}
                  onChange={e => setForm({ ...form, roiText: e.target.value })}
                  placeholder="e.g. 12%"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Completion Display</Label>
                <Input
                  value={form.completionText}
                  onChange={e => setForm({ ...form, completionText: e.target.value })}
                  placeholder="e.g. Q2 2027"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Published Status</Label>
                <select
                  value={form.isPublished ? 'true' : 'false'}
                  onChange={e => setForm({ ...form, isPublished: e.target.value === 'true' })}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm"
                >
                  <option value="true">Published (Visible on /iigprojects)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t justify-end">
              <Button
                variant="outline"
                onClick={() => { setIsAdding(false); setEditingProjectId(null) }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!form.name || saveMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingProjectId ? 'Update Project' : 'Save & Upload Media'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 w-full sm:max-w-md">
        <Input
          placeholder="Search portfolio projects by name, slug, city..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-white"
        />
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-neutral-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" /> Loading portfolio projects...
        </div>
      ) : searchedProjects.length === 0 ? (
        <Card className="shadow-sm border-neutral-200">
          <CardContent className="p-12 text-center text-neutral-500">
            No portfolio projects found matching your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchedProjects.map((project: any) => (
            <Card key={project.id} className="shadow-sm hover:shadow-md transition-shadow border-neutral-200 overflow-hidden flex flex-col">
              {/* Cover Image Header */}
              <div className="relative h-48 bg-neutral-900 overflow-hidden group">
                {project.coverImageUrl ? (
                  <img
                    src={project.coverImageUrl}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500 bg-neutral-100">
                    <Building2 className="w-10 h-10 stroke-1" />
                  </div>
                )}
                {/* Status Badge Overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${
                    project.isPublished ? 'bg-emerald-500 text-white' : 'bg-neutral-800/80 text-white backdrop-blur-sm'
                  }`}>
                    {project.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded text-xs font-mono">
                  /iigproject/{project.slug || project.id}
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-neutral-900 line-clamp-1">{project.name}</h3>
                  </div>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {project.city || 'Georgia'} &bull; {project.projectType || 'Apartments'}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t text-xs">
                    <div>
                      <span className="text-neutral-400 block font-medium">Starting Price</span>
                      <span className="font-bold text-neutral-900">{project.startingPriceText || '-'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-medium">Type</span>
                      <span className="font-semibold text-neutral-800 line-clamp-1">{project.projectType || '-'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-medium">Payment Plan</span>
                      <span className="font-semibold text-neutral-700">{project.paymentPlanText || '-'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-medium">Size</span>
                      <span className="font-semibold text-neutral-700">{project.sizeText || '-'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-medium">ROI</span>
                      <span className="font-bold text-emerald-600">{project.roiText || '-'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-medium">Completion</span>
                      <span className="font-semibold text-neutral-700">{project.completionText || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublishMutation.mutate({ id: project.id, isPublished: project.isPublished })}
                      className="text-xs text-neutral-600 hover:text-neutral-900"
                    >
                      {project.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
                            deleteMutation.mutate(project.id)
                          }
                        }}
                        className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Link href={`/cms/project-portfolio/${project.id}`}>
                      <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Media &amp; Specs
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectPortfolioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-400">Loading portfolio...</div>}>
      <ProjectPortfolioContent />
    </Suspense>
  )
}
