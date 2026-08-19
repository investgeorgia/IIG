'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Loader2, Link as LinkIcon, Check, Copy, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useFileUpload } from '@/hooks/useFileUpload'
import { FileUploadProgressModal } from '@/components/cms/FileUploadProgressModal'

export default function SalespersonsPage() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [active, setActive] = useState(true)
  const [uploading, setUploading] = useState(false)

  const { data: salespersons = [], isLoading } = useQuery({
    queryKey: ['salespersons'],
    queryFn: async () => {
      const res = await fetch('/api/cms/salespersons')
      if (!res.ok) throw new Error('Failed to fetch salespersons')
      return res.json()
    },
    enabled: !permissionsLoading && hasPermission('Salespersons', 'VIEW'),
    retry: 2,
  })

  const { progressInfo, uploadFiles, cancelUpload, resetProgress } = useFileUpload()

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true)
      try {
        await uploadFiles([file], {
          type: 'IMAGE',
          projectId: 'general',
          onSingleSuccess: (f, data) => {
            if (data && data.url) {
              setProfileImage(data.url)
              toast.success('Profile picture uploaded successfully')
            }
          }
        })
      } finally {
        setUploading(false)
      }
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        phone: phone.trim(),
        email: email.trim(),
        profileImage: profileImage || null,
        active
      }

      const url = editingId ? `/api/cms/salespersons/${editingId}` : '/api/cms/salespersons'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] })
      resetForm()
      toast.success(editingId ? 'Salesperson updated' : 'Salesperson created')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/cms/salespersons/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] })
      toast.success('Salesperson deleted')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  const handleEdit = (sp: any) => {
    setEditingId(sp.id)
    setName(sp.name)
    setSlug(sp.slug)
    setPhone(sp.phone)
    setEmail(sp.email)
    setProfileImage(sp.profileImage || '')
    setActive(sp.active)
    setIsAdding(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setSlug('')
    setPhone('')
    setEmail('')
    setProfileImage('')
    setActive(true)
    setIsAdding(false)
  }

  const copyReferralLink = (spSlug: string, id: number) => {
    const link = `${window.location.origin}/iigprojects/ref/${spSlug}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    toast.success('Referral link copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>
  
  if (!hasPermission('Salespersons', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Salespersons Management.
      </div>
    )
  }

  const canEdit = hasPermission('Salespersons', 'EDIT')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salespersons</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage unique referral slugs, WhatsApp contact details, and status for sales team members.</p>
        </div>
        {canEdit && !isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Salesperson
          </Button>
        )}
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm border border-neutral-100">
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? 'Edit Salesperson' : 'New Salesperson'}</CardTitle>
            <CardDescription>Enter the salesperson's profile details and unique referral slug.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input placeholder="e.g. Ahmed Al-Mansoori" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Referral Slug * (Lowercase, no spaces)</Label>
                <Input placeholder="e.g. ahmed" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp Number * (Including country code, e.g. 971501111111)</Label>
                <Input placeholder="e.g. 971501111111" value={phone} onChange={e => setPhone(e.target.value.replace(/\+/g, ''))} />
              </div>
              <div className="space-y-1">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="e.g. ahmed@investingeorgia.ae" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  {profileImage && (
                    <img src={profileImage} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover border border-neutral-200" />
                  )}
                  <div className="flex-1 max-w-sm">
                    <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                    <Label htmlFor="profile-upload" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-sm">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-neutral-500" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2 text-neutral-400" />
                      )}
                      Upload Image
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded border-neutral-300 text-red-600 focus:ring-red-500" />
                <Label htmlFor="active">Active & Enabled (Allows referral redirection)</Label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button onClick={() => saveMutation.mutate()} disabled={!name || !slug || !phone || !email || saveMutation.isPending || uploading} className="bg-red-600 hover:bg-red-700 text-white">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border border-neutral-100">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" /></div>
          ) : salespersons.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No salespeople found. Add one above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                  <tr>
                    <th className="px-6 py-3">Profile</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Slug</th>
                    <th className="px-6 py-3">WhatsApp</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salespersons.map((sp: any) => (
                    <tr key={sp.id} className="bg-white border-b hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {sp.profileImage ? (
                          <img src={sp.profileImage} alt={sp.name} className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
                            {sp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-neutral-900">{sp.name}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-neutral-600 bg-neutral-50 px-2 py-1 rounded border border-neutral-200 text-xs">
                          {sp.slug}
                        </span>
                      </td>
                      <td className="px-6 py-4">+{sp.phone}</td>
                      <td className="px-6 py-4">{sp.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sp.active 
                            ? 'bg-green-50 text-green-700 border border-green-200/50' 
                            : 'bg-neutral-50 text-neutral-500 border border-neutral-200/50'
                        }`}>
                          {sp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-neutral-400 hover:text-blue-600"
                            onClick={() => copyReferralLink(sp.slug, sp.id)}
                            title="Copy Referral Link"
                          >
                            {copiedId === sp.id ? <Check className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4" />}
                          </Button>
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-blue-600" onClick={() => handleEdit(sp)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600" onClick={() => {
                                if (confirm(`Are you sure you want to delete salesperson "${sp.name}"?`)) {
                                  deleteMutation.mutate(sp.id)
                                }
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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

      <FileUploadProgressModal
        progressInfo={progressInfo}
        onCancel={cancelUpload}
        onClose={resetProgress}
      />
    </div>
  )
}
