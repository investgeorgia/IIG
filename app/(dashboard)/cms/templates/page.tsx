'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit, Loader2, Star, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { usePermissions } from '@/hooks/usePermissions'

const DEFAULT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
  <div style="text-align: center; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px;">
    <h1 style="color: #dc2626; margin: 0;">Exclusive Proposal</h1>
    <p style="font-size: 18px; color: #666; margin-top: 5px;">Prepared for {{customer_name}}</p>
  </div>
  
  <div style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; margin-bottom: 15px;">{{project_name}}</h2>
    <p style="font-size: 16px; line-height: 1.6;">{{customer_message}}</p>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
    <tr style="background: #f9fafb; border-bottom: 1px solid #e5e5e5;">
      <th style="text-align: left; padding: 12px; width: 30%;">Unit</th>
      <td style="padding: 12px;">{{unit_number}} ({{unit_type}})</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <th style="text-align: left; padding: 12px;">Size</th>
      <td style="padding: 12px;">{{unit_size}} m²</td>
    </tr>
    <tr style="background: #f9fafb; border-bottom: 1px solid #e5e5e5;">
      <th style="text-align: left; padding: 12px;">Beds / Baths</th>
      <td style="padding: 12px;">{{unit_beds}} / {{unit_baths}}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e5e5e5;">
      <th style="text-align: left; padding: 12px;">Base Price</th>
      <td style="padding: 12px; font-weight: bold;">{{unit_price}}</td>
    </tr>
    <tr style="background: #fef2f2;">
      <th style="text-align: left; padding: 12px; color: #dc2626; font-size: 18px;">Special Offer</th>
      <td style="padding: 12px; color: #dc2626; font-size: 18px; font-weight: bold;">{{final_price}}</td>
    </tr>
  </table>

  <div style="margin-bottom: 40px;">
    <h2 style="font-size: 22px; margin-bottom: 15px;">Gallery</h2>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      {{images_gallery}}
    </div>
  </div>
</div>`

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', content: DEFAULT_TEMPLATE, isDefault: false })

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await fetch('/api/cms/templates')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch templates')
      }
      return res.json()
    },
    enabled: hasPermission('Templates', 'VIEW')
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editingId ? `/api/cms/templates/${editingId}` : '/api/cms/templates'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Failed to save template')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setIsAdding(false)
      setEditingId(null)
      toast.success('Template saved successfully')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/cms/templates/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted')
    }
  })

  const openEdit = (t: any) => {
    setForm({ name: t.name, content: t.content, isDefault: t.isDefault })
    setEditingId(t.id)
    setIsAdding(true)
  }

  const resetForm = () => {
    setForm({ name: '', content: DEFAULT_TEMPLATE, isDefault: false })
    setIsAdding(false)
    setEditingId(null)
  }

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>

  if (!hasPermission('Templates', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Templates.
      </div>
    )
  }

  const canEdit = hasPermission('Templates', 'EDIT')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal Templates</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage HTML templates for your PDF proposals.</p>
        </div>
        {!isAdding && canEdit && (
          <Button onClick={() => { resetForm(); setIsAdding(true) }} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Button>
        )}
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm border-red-100">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Template' : 'New Template'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Template Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. VIP Offer Template" />
              </div>
              <div className="space-y-1 flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 text-red-600 rounded" />
                  Make default template
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <Label>HTML Content *</Label>
                <div className="text-xs text-neutral-500">
                  Supported Variables: {'{{customer_name}}, {{project_name}}, {{unit_number}}, {{unit_type}}, {{unit_price}}, {{final_price}}, {{images_gallery}}, {{customer_message}}, {{building}}, {{renovation_price}}, {{renovation_html}}'}
                </div>
              </div>
              <textarea 
                value={form.content} 
                onChange={e => setForm({ ...form, content: e.target.value })} 
                className="w-full h-96 p-4 font-mono text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="Paste your HTML here..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.content || saveMutation.isPending} className="bg-red-600 hover:bg-red-700">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Template
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAdding && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No templates found. Create one to get started.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                  <tr>
                    <th className="px-6 py-3">Template Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t: any) => (
                    <tr key={t.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-400" /> {t.name}
                      </td>
                      <td className="px-6 py-4">
                        {t.isDefault ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                            <Star className="w-3 h-3 fill-amber-500" /> Default
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canEdit ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="text-neutral-500 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { if(confirm('Delete template?')) deleteMutation.mutate(t.id) }} className="text-neutral-400 hover:text-red-600">
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
      )}
    </div>
  )
}

function FileText(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
  )
}
