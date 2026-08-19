'use client'

import { useState, use, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Upload, Trash2, Edit3, Check, Star, Play, Image as ImageIcon, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useFileUpload } from '@/hooks/useFileUpload'
import { FileUploadProgressModal } from '@/components/cms/FileUploadProgressModal'

export default function PortfolioProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()

  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details')
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null)
  const [editingMediaName, setEditingMediaName] = useState('')

  // Upload hook for tracking speed, progress bar, ETA modal
  const { progressInfo, uploadFiles, cancelUpload } = useFileUpload()
  const [isUploading, setIsUploading] = useState(false)

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['portfolio-project', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      return res.json()
    },
    enabled: hasPermission('Projects', 'VIEW')
  })

  // Fetch project media
  const { data: mediaFiles = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['portfolio-project-media', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}/media`)
      if (!res.ok) throw new Error('Failed to fetch media')
      return res.json()
    },
    enabled: hasPermission('Projects', 'VIEW')
  })

  // Form state
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        slug: project.slug || '',
        city: project.city || 'Tbilisi',
        projectType: project.projectType || '',
        startingPriceText: project.startingPriceText || '',
        paymentPlanText: project.paymentPlanText || '',
        sizeText: project.sizeText || '',
        roiText: project.roiText || '',
        completionText: project.completionText || '',
        description: project.description || '',
        isPublished: project.isPublished ?? true,
        coverImageUrl: project.coverImageUrl || ''
      })
    }
  }, [project])

  // Update details mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/cms/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update project')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-project', id] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-projects'] })
      toast.success('Project specs updated successfully!')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update project')
  })

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const res = await fetch(`/api/cms/media/${mediaId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete media')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-project-media', id] })
      toast.success('Media removed')
    }
  })

  // Rename media mutation
  const renameMediaMutation = useMutation({
    mutationFn: async ({ mediaId, name }: { mediaId: number; name: string }) => {
      const res = await fetch(`/api/cms/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error('Failed to rename file')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-project-media', id] })
      setEditingMediaId(null)
      toast.success('File renamed')
    }
  })

  // Handle Media File Upload (Images & Videos)
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    setIsUploading(true)

    try {
      const result = await uploadFiles(fileList, {
        type: 'image',
        projectId: id as string,
        folder: 'iigproject',
        slug: project?.slug || (id as string),
        onSingleSuccess: async (file, responseData) => {
          if (responseData && responseData.url) {
            const isVideo = file.type.startsWith('video/') || responseData.url.endsWith('.mp4') || responseData.url.endsWith('.webm')
            await fetch(`/api/cms/projects/${id}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: isVideo ? 'VIDEO' : 'IMAGE',
                url: responseData.url,
                name: responseData.name || file.name,
                size: responseData.size || file.size,
                mimeType: responseData.mimeType || file.type
              })
            })
          }
        }
      })

      if (result.successful > 0) {
        queryClient.invalidateQueries({ queryKey: ['portfolio-project-media', id] })
        queryClient.invalidateQueries({ queryKey: ['portfolio-project', id] })
        toast.success(`${result.successful} file(s) uploaded successfully!`)
      }
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  if (permissionsLoading || projectLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin" /> Loading project editor...
      </div>
    )
  }

  if (!hasPermission('Projects', 'VIEW')) {
    return <div className="p-8 text-center text-red-600">Unauthorized</div>
  }

  const canEdit = hasPermission('Projects', 'EDIT')

  return (
    <div className="space-y-6">
      {/* Upload Progress Modal */}
      <FileUploadProgressModal
        progressInfo={progressInfo}
        onCancel={cancelUpload}
      />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-neutral-500">
        <Link href="/cms/project-portfolio" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Project Portfolio
        </Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">{project?.name}</span>
      </div>

      {/* Header Banner */}
      <Card className="shadow-sm border-neutral-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-neutral-900">{project?.name}</h1>
                <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                  project?.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {project?.isPublished ? 'Published on /iigprojects' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> {project?.city} &bull; Target Folder: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono">media/iigproject/{project?.slug || project?.id}</code>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {canEdit && (
                <Button
                  variant={project?.isPublished ? 'outline' : 'default'}
                  className={!project?.isPublished ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                  onClick={() => updateProjectMutation.mutate({ isPublished: !project?.isPublished })}
                  disabled={updateProjectMutation.isPending}
                >
                  {project?.isPublished ? 'Unpublish' : 'Publish Project'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-4 -mb-px">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Project Specs &amp; Details
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'media'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Media Gallery (Images &amp; Videos)
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-bold">
              {mediaFiles.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ─── TAB 1: DETAILS & SPECS ─── */}
      {activeTab === 'details' && (
        <Card className="shadow-sm border-neutral-200">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-bold">Project Metadata &amp; Display Specifications</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateProjectMutation.mutate(formData)
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Project Name *</Label>
                  <Input
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">URL Slug (Folder Name)</Label>
                  <Input
                    value={formData.slug || ''}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. kavtaradze"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City / Location</Label>
                  <Input
                    value={formData.city || ''}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Tbilisi"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Project Type</Label>
                  <Input
                    value={formData.projectType || ''}
                    onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                    placeholder="e.g. 2-4 Bedroom Apartments"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Starting Price Display</Label>
                  <Input
                    value={formData.startingPriceText || ''}
                    onChange={e => setFormData({ ...formData, startingPriceText: e.target.value })}
                    placeholder="e.g. $140,000"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payment Plan Display</Label>
                  <Input
                    value={formData.paymentPlanText || ''}
                    onChange={e => setFormData({ ...formData, paymentPlanText: e.target.value })}
                    placeholder="e.g. 15 / 10 / 75"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Size Display</Label>
                  <Input
                    value={formData.sizeText || ''}
                    onChange={e => setFormData({ ...formData, sizeText: e.target.value })}
                    placeholder="e.g. From 54.2 m²"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">ROI Display</Label>
                  <Input
                    value={formData.roiText || ''}
                    onChange={e => setFormData({ ...formData, roiText: e.target.value })}
                    placeholder="e.g. 12%"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Completion Date Display</Label>
                  <Input
                    value={formData.completionText || ''}
                    onChange={e => setFormData({ ...formData, completionText: e.target.value })}
                    placeholder="e.g. Q2 2027"
                  />
                </div>
                <div className="space-y-1 md:col-span-3">
                  <Label className="text-xs font-semibold">Description</Label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Full project description..."
                  />
                </div>
              </div>

              {canEdit && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {updateProjectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Specifications
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 2: MEDIA GALLERY & UPLOADER ─── */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          {canEdit && (
            <Card className="shadow-sm border-dashed border-2 border-neutral-300 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
              <CardContent className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Upload Project Images &amp; Videos</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Files will be automatically uploaded to <code className="bg-neutral-200 px-1 rounded">media/iigproject/{project?.slug || id}</code>
                  </p>
                </div>
                <div>
                  <label className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg cursor-pointer transition-colors shadow-sm">
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading Files...
                      </span>
                    ) : (
                      'Select Images / Videos'
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media Grid */}
          <Card className="shadow-sm border-neutral-200">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold">Uploaded Assets ({mediaFiles.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {mediaLoading ? (
                <div className="text-center py-12 text-neutral-400">Loading gallery...</div>
              ) : mediaFiles.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No images or videos uploaded yet. Use the uploader above to add media.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaFiles.map((media: any) => {
                    const isVideo = media.type === 'VIDEO' || media.url?.endsWith('.mp4') || media.url?.endsWith('.webm')
                    const isCover = project?.coverImageUrl === media.url

                    return (
                      <div key={media.id} className="group relative bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-200 flex flex-col">
                        {/* Media Preview */}
                        <div className="relative h-44 bg-neutral-900 overflow-hidden flex items-center justify-center">
                          {isVideo ? (
                            <video src={media.url} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={media.url} alt={media.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            {isVideo && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-600 text-white flex items-center gap-1 shadow-sm">
                                <Play className="w-3 h-3 fill-current" /> VIDEO
                              </span>
                            )}
                            {isCover && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-current" /> COVER
                              </span>
                            )}
                          </div>
                        </div>

                        {/* File details & actions */}
                        <div className="p-3 bg-white flex-1 flex flex-col justify-between space-y-2 border-t">
                          {editingMediaId === media.id ? (
                            <div className="flex gap-1">
                              <Input
                                value={editingMediaName}
                                onChange={e => setEditingMediaName(e.target.value)}
                                className="h-8 text-xs"
                              />
                              <Button
                                size="sm"
                                className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => renameMediaMutation.mutate({ mediaId: media.id, name: editingMediaName })}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-neutral-800 truncate block">
                                {media.name || 'Untitled Asset'}
                              </span>
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    setEditingMediaId(media.id)
                                    setEditingMediaName(media.name || '')
                                  }}
                                  className="text-neutral-400 hover:text-neutral-700"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-2 border-t text-xs">
                            {!isCover && !isVideo && canEdit && (
                              <button
                                onClick={() => updateProjectMutation.mutate({ coverImageUrl: media.url })}
                                className="text-[11px] font-medium text-amber-600 hover:underline flex items-center gap-1"
                              >
                                Set Cover
                              </button>
                            )}

                            {canEdit && (
                              <button
                                onClick={() => {
                                  if (confirm('Delete this file from gallery?')) {
                                    deleteMediaMutation.mutate(media.id)
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 ml-auto flex items-center gap-1 text-[11px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
