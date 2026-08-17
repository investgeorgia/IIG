'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Download, Send, CheckCircle, FileText, User, Building2, MapPin, Pencil, Plus, Trash2, X, Check, Upload, Eye, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-purple-100 text-purple-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const USD_TO_AED = 3.6725

export default function ProposalDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)

  // Edit form state
  const [editCustomPrice, setEditCustomPrice] = useState('')
  const [editDiscount, setEditDiscount] = useState('')
  const [editTowerBlock, setEditTowerBlock] = useState('')
  const [editUnitCondition, setEditUnitCondition] = useState('')
  const [editMessage, setEditMessage] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editPaymentPlan, setEditPaymentPlan] = useState<{ id: number, milestone: string, percentage: number, date: string, subMilestones?: { id: number, milestone: string, percentage: number, date: string }[] }[]>([])
  const [editSelectedImages, setEditSelectedImages] = useState<string[]>([])
  const [editCustomFloorPlanUrl, setEditCustomFloorPlanUrl] = useState('')
  const [editCustomFloorPlanUrl2, setEditCustomFloorPlanUrl2] = useState('')
  const [editPricingType, setEditPricingType] = useState('Base Price')
  const [editSelectedPriceVal, setEditSelectedPriceVal] = useState<number>(0)
  const [editPaymentPlanName, setEditPaymentPlanName] = useState('Standard Plan')
  const [editVisibleFields, setEditVisibleFields] = useState<string[]>([])
  const [editHandover, setEditHandover] = useState('')
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null)
  
  const [floorPlanUploading, setFloorPlanUploading] = useState(false)
  const [floorPlanUploading2, setFloorPlanUploading2] = useState(false)
  const [divideInputs, setDivideInputs] = useState<Record<number, string>>({})
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null)

  const { data: proposal, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${id}`)
      if (!res.ok) throw new Error('Proposal not found')
      return res.json()
    }
  })

  // Prefill edit form when proposal loads
  useEffect(() => {
    if (!proposal) return
    const snap = proposal.snapshot as any
    setEditCustomPrice(proposal.customPrice ? String(Number(proposal.customPrice)) : '')
    setEditDiscount(proposal.discountPercent ? String(proposal.discountPercent) : '')
    setEditTowerBlock(snap.unit?.towerBlock || '')
    setEditUnitCondition(snap.unit?.condition || '')
    setEditMessage(proposal.customerMessage || '')
    setEditNotes(proposal.notes || '')
    const pp = snap.customPaymentPlan
    setEditPaymentPlan(Array.isArray(pp) ? pp.map((p: any, i: number) => ({ ...p, id: p.id || Date.now() + i })) : [])
    const imgs = Array.isArray(proposal.selectedImages) ? proposal.selectedImages : []
    setEditSelectedImages(imgs)

    // New fields
    setEditCustomFloorPlanUrl(snap.unit?.floorPlanUrl || '')
    setEditCustomFloorPlanUrl2(snap.unit?.floorPlanUrl2 || '')
    setEditPricingType(proposal.pricingType || 'Base Price')
    setEditSelectedPriceVal(proposal.selectedPrice ? Number(proposal.selectedPrice) : (snap.unit?.price ? Number(snap.unit.price) : 0))
    setEditPaymentPlanName(proposal.paymentPlanName || 'Standard Plan')
    setEditVisibleFields(Array.isArray(proposal.visibleFields) ? proposal.visibleFields : ['building', 'renovationPrice', 'showClientName', 'showClientMessage', 'showConsultantFooter'])
    setEditHandover(proposal.handover ? new Date(proposal.handover).toISOString().split('T')[0] : '')
    setEditTemplateId(proposal.templateId ? Number(proposal.templateId) : null)
  }, [proposal])

  const snap = proposal?.snapshot as any
  const projectId = snap?.project?.id
  const unitId = snap?.unit?.id

  // Supplementary queries
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await fetch('/api/cms/templates')).json(),
    enabled: isEditing
  })

  const { data: projectPlans = [] } = useQuery({
    queryKey: ['project-payment-plans', projectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${projectId}/payment-plans`)).json(),
    enabled: !!projectId && isEditing
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units', projectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${projectId}/units`)).json(),
    enabled: !!projectId && isEditing
  })
  const currentUnit = units.find((u: any) => u.id === unitId)

  // Project media for image picker
  const { data: projectMedia = [] } = useQuery({
    queryKey: ['media', projectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${projectId}/media`)).json(),
    enabled: !!projectId && isEditing
  })

  const projectFloorPlans = (Array.isArray(projectMedia) ? projectMedia : []).filter((m: any) => m.type === 'FLOOR_PLAN')

  const availableImages: any[] = []
  const addedUrls = new Set<string>()
  const rawImages = [
    ...projectMedia.filter((m: any) => m.type === 'IMAGE'),
    ...(snap?.unit?.floorPlanUrl ? [{ id: 'floorplan', url: snap.unit.floorPlanUrl }] : []),
    ...(snap?.unit?.floorPlanUrl2 ? [{ id: 'floorplan2', url: snap.unit.floorPlanUrl2 }] : [])
  ]
  rawImages.forEach((img: any) => {
    if (img.url && !addedUrls.has(img.url)) {
      addedUrls.add(img.url)
      availableImages.push(img)
    }
  })

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setFloorPlanUploading(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'FLOOR_PLAN')
      
      const res = await fetch('/api/uploads', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setEditCustomFloorPlanUrl(data.url)
        toast.success('Custom floor plan uploaded')
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setFloorPlanUploading(false)
    }
  }

  const handleFloorPlanUpload2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setFloorPlanUploading2(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'FLOOR_PLAN')
      
      const res = await fetch('/api/uploads', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setEditCustomFloorPlanUrl2(data.url)
        toast.success('Second custom floor plan uploaded')
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setFloorPlanUploading2(false)
    }
  }

  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/proposals/${id}/pdf`, { method: 'POST' })
        const text = await res.text()
        let data: any = {}
        try {
          data = JSON.parse(text)
        } catch {
          window.open(`/proposals/${id}/template?print=true`, '_blank')
          return
        }
        if (data.pdfUrl) {
          window.open(data.pdfUrl, '_blank')
        } else {
          window.open(`/proposals/${id}/template?print=true`, '_blank')
        }
      } catch {
        window.open(`/proposals/${id}/template?print=true`, '_blank')
      }
    },
    onSuccess: () => toast.success('Proposal document opened!'),
    onError: (e: any) => toast.error(e.message)
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
    },
    onSuccess: () => {
      toast.success('Status updated')
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
    }
  })

  const editMutation = useMutation({
    mutationFn: async () => {
      const totalPaymentPlanPercent = editPaymentPlan.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0)
      if (totalPaymentPlanPercent > 100) {
        throw new Error(`Total payment plan percentage cannot exceed 100% (currently ${totalPaymentPlanPercent}%)`)
      }

      const res = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrice: editCustomPrice ? Number(editCustomPrice) : null,
          discountPercent: editDiscount ? Number(editDiscount) : null,
          customerMessage: editMessage,
          notes: editNotes,
          selectedImages: editSelectedImages,
          towerBlock: editTowerBlock,
          unitCondition: editUnitCondition,
          paymentPlan: editPaymentPlan,
          customFloorPlanUrl: editCustomFloorPlanUrl || null,
          customFloorPlanUrl2: editCustomFloorPlanUrl2 || null,
          pricingType: editPricingType,
          selectedPrice: editSelectedPriceVal,
          paymentPlanName: editPaymentPlanName,
          visibleFields: editVisibleFields,
          handover: editHandover || null,
          templateId: editTemplateId,
        })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Proposal updated!')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['proposal', id] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>
  if (!proposal) return <div className="p-8 text-center">Proposal not found</div>

  const snapshot = proposal.snapshot || {}
  const pricingOptions = snapshot?.unit ? [
    { type: 'Base Price', label: `Base Price - ${Number(snapshot.unit.price).toLocaleString()} USD`, price: Number(snapshot.unit.price), defaultDelivery: snapshot.unit.deliveryForm || 'Base Price' },
    ...(snapshot.unit.blackFramePrice ? [{ type: 'Black Frame', label: `Black Frame - ${Number(snapshot.unit.blackFramePrice).toLocaleString()} USD`, price: Number(snapshot.unit.blackFramePrice), defaultDelivery: 'Black Frame' }] : []),
    ...(snapshot.unit.whiteFramePrice ? [{ type: 'White Frame', label: `White Frame - ${Number(snapshot.unit.whiteFramePrice).toLocaleString()} USD`, price: Number(snapshot.unit.whiteFramePrice), defaultDelivery: 'White Frame' }] : []),
    ...(snapshot.unit.greenFramePrice ? [{ type: 'Green Frame', label: `Green Frame - ${Number(snapshot.unit.greenFramePrice).toLocaleString()} USD`, price: Number(snapshot.unit.greenFramePrice), defaultDelivery: 'Green Frame' }] : []),
    ...(snapshot.unit.turnkeyPrice ? [{ type: 'Turnkey', label: `Turnkey - ${Number(snapshot.unit.turnkeyPrice).toLocaleString()} USD`, price: Number(snapshot.unit.turnkeyPrice), defaultDelivery: 'Turnkey' }] : []),
  ] : []
  const basePrice = Number(proposal.selectedPrice || snapshot.unit?.price || 0)
  const finalPriceNum = proposal.customPrice
    ? Number(proposal.customPrice)
    : basePrice - (basePrice * (proposal.discountPercent || 0) / 100)

  const editBasePrice = editCustomPrice
    ? Number(editCustomPrice)
    : basePrice - (basePrice * (Number(editDiscount) || 0) / 100)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/proposals" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> All Proposals
        </Link>
        <span>/</span>
        <span className="font-medium text-neutral-900">Proposal #{proposal.id}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Proposal for {proposal.customer?.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Created on {new Date(proposal.createdAt).toLocaleDateString()} {new Date(proposal.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={proposal.status}
            onChange={(e) => updateStatusMutation.mutate(e.target.value)}
            disabled={updateStatusMutation.isPending}
            className={`px-3 py-1 rounded-full text-xs font-semibold border outline-none cursor-pointer appearance-none ${STATUS_COLORS[proposal.status] || ''}`}
          >
            {['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </Button>
          <Button onClick={() => generatePdfMutation.mutate()} disabled={generatePdfMutation.isPending} className="bg-red-600 hover:bg-red-700">
            {generatePdfMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Generate PDF
          </Button>
        </div>
      </div>

      {/* ─── EDIT MODAL ─── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">Edit Proposal</h2>
              <button onClick={() => setIsEditing(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Pricing */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Pricing</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500 font-semibold">Pricing Type</Label>
                    <select
                      value={editSelectedPriceVal}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setEditSelectedPriceVal(val)
                        const opt = pricingOptions.find(o => o.price === val)
                        if (opt) {
                          setEditPricingType(opt.type)
                          setEditUnitCondition(opt.defaultDelivery)
                        }
                        if (editDiscount) {
                          const discounted = val * (1 - Number(editDiscount) / 100)
                          setEditCustomPrice(discounted.toFixed(0))
                        }
                      }}
                      className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-medium"
                    >
                      {pricingOptions.map(opt => (
                        <option key={opt.type} value={opt.price}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Custom Price (USD)</Label>
                    <Input
                      type="number"
                      placeholder={String(editSelectedPriceVal)}
                      value={editCustomPrice}
                      onChange={e => {
                        const cPrice = e.target.value
                        setEditCustomPrice(cPrice)
                        if (cPrice && editSelectedPriceVal > 0) {
                          const disc = ((editSelectedPriceVal - Number(cPrice)) / editSelectedPriceVal) * 100
                          setEditDiscount(disc > 0 ? disc.toFixed(1) : '0')
                        } else {
                          setEditDiscount('')
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Discount (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={editDiscount}
                      onChange={e => {
                        const pct = e.target.value
                        setEditDiscount(pct)
                        if (pct && editSelectedPriceVal > 0) {
                          const discounted = editSelectedPriceVal * (1 - Number(pct) / 100)
                          setEditCustomPrice(discounted.toFixed(0))
                        } else {
                          setEditCustomPrice('')
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Property Info</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Tower/Block</Label>
                    <Input placeholder="e.g. Tower A" value={editTowerBlock} onChange={e => setEditTowerBlock(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Unit Condition</Label>
                    <Input placeholder="e.g. White Frame, Turnkey" value={editUnitCondition} onChange={e => setEditUnitCondition(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Handover Date (Overrides Project/Unit)</Label>
                    <Input type="date" value={editHandover} onChange={e => setEditHandover(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Display Fields */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <Label className="font-semibold text-neutral-800 text-sm">Display Fields in Proposal</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVisibleFields.includes('building')}
                      onChange={e => {
                        if (e.target.checked) setEditVisibleFields([...editVisibleFields, 'building'])
                        else setEditVisibleFields(editVisibleFields.filter(f => f !== 'building'))
                      }}
                      className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    Show Building
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVisibleFields.includes('renovationPrice')}
                      onChange={e => {
                        if (e.target.checked) setEditVisibleFields([...editVisibleFields, 'renovationPrice'])
                        else setEditVisibleFields(editVisibleFields.filter(f => f !== 'renovationPrice'))
                      }}
                      className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    Show Renovation Price
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVisibleFields.includes('showClientName')}
                      onChange={e => {
                        if (e.target.checked) setEditVisibleFields([...editVisibleFields, 'showClientName'])
                        else setEditVisibleFields(editVisibleFields.filter(f => f !== 'showClientName'))
                      }}
                      className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    Show Client Name
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVisibleFields.includes('showClientMessage')}
                      onChange={e => {
                        if (e.target.checked) setEditVisibleFields([...editVisibleFields, 'showClientMessage'])
                        else setEditVisibleFields(editVisibleFields.filter(f => f !== 'showClientMessage'))
                      }}
                      className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    Show Client Message
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editVisibleFields.includes('showConsultantFooter')}
                      onChange={e => {
                        if (e.target.checked) setEditVisibleFields([...editVisibleFields, 'showConsultantFooter'])
                        else setEditVisibleFields(editVisibleFields.filter(f => f !== 'showConsultantFooter'))
                      }}
                      className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    Show Sales Rep Footer
                  </label>
                </div>
              </div>

              {/* Message & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Message to Customer</Label>
                  <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={3}
                    className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Internal Notes (private)</Label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3}
                    placeholder="Notes not shown in PDF"
                    className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                </div>
              </div>

              {/* Custom Floor Plan Images 1 & 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-neutral-800">Floor Plan Image 1</Label>
                  <div className="flex gap-2">
                    <Input placeholder="URL or upload..." value={editCustomFloorPlanUrl} onChange={e => setEditCustomFloorPlanUrl(e.target.value)} className="flex-1 text-xs" />
                    <input type="file" id="edit-custom-floor-upload" className="hidden" accept="image/*" onChange={handleFloorPlanUpload} />
                    <label htmlFor="edit-custom-floor-upload" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-xs">
                      {floorPlanUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                  {projectFloorPlans.length > 0 && (
                    <select
                      value={editCustomFloorPlanUrl}
                      onChange={e => setEditCustomFloorPlanUrl(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 mt-1.5"
                    >
                      <option value="">Or select project floor plan...</option>
                      {projectFloorPlans.map((fp: any) => (
                        <option key={fp.id} value={fp.url}>{fp.name || fp.url.split('/').pop()}</option>
                      ))}
                    </select>
                  )}
                  {(editCustomFloorPlanUrl || proposal?.unit?.floorPlanUrl) && (
                    <div className="relative mt-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-2.5 group overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-20 shrink-0 rounded-md border border-neutral-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                          <img src={editCustomFloorPlanUrl || proposal?.unit?.floorPlanUrl} alt="Floor Plan 1" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: editCustomFloorPlanUrl || proposal?.unit?.floorPlanUrl, title: 'Floor Plan Image 1' })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            title="View full image"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-800 truncate">
                              {editCustomFloorPlanUrl ? 'Custom Floor Plan 1' : 'Saved Unit Floor Plan 1'}
                            </span>
                            {editCustomFloorPlanUrl && (
                              <button
                                type="button"
                                onClick={() => setEditCustomFloorPlanUrl('')}
                                className="text-neutral-400 hover:text-red-500 text-xs flex items-center gap-0.5"
                                title="Reset to default unit floor plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{editCustomFloorPlanUrl || proposal?.unit?.floorPlanUrl}</p>
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: editCustomFloorPlanUrl || proposal?.unit?.floorPlanUrl, title: 'Floor Plan Image 1' })}
                            className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Floor Plan 1
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-neutral-800">Floor Plan Image 2</Label>
                  <div className="flex gap-2">
                    <Input placeholder="URL or upload..." value={editCustomFloorPlanUrl2} onChange={e => setEditCustomFloorPlanUrl2(e.target.value)} className="flex-1 text-xs" />
                    <input type="file" id="edit-custom-floor-upload-2" className="hidden" accept="image/*" onChange={handleFloorPlanUpload2} />
                    <label htmlFor="edit-custom-floor-upload-2" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-xs">
                      {floorPlanUploading2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                  {projectFloorPlans.length > 0 && (
                    <select
                      value={editCustomFloorPlanUrl2}
                      onChange={e => setEditCustomFloorPlanUrl2(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 mt-1.5"
                    >
                      <option value="">Or select project floor plan...</option>
                      {projectFloorPlans.map((fp: any) => (
                        <option key={fp.id} value={fp.url}>{fp.name || fp.url.split('/').pop()}</option>
                      ))}
                    </select>
                  )}
                  {(editCustomFloorPlanUrl2 || proposal?.unit?.floorPlanUrl2) && (
                    <div className="relative mt-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-2.5 group overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative h-16 w-20 shrink-0 rounded-md border border-neutral-200 bg-white overflow-hidden flex items-center justify-center shadow-xs">
                          <img src={editCustomFloorPlanUrl2 || proposal?.unit?.floorPlanUrl2} alt="Floor Plan 2" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: editCustomFloorPlanUrl2 || proposal?.unit?.floorPlanUrl2, title: 'Floor Plan Image 2' })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            title="View full image"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-800 truncate">
                              {editCustomFloorPlanUrl2 ? 'Custom Floor Plan 2' : 'Saved Unit Floor Plan 2'}
                            </span>
                            {editCustomFloorPlanUrl2 && (
                              <button
                                type="button"
                                onClick={() => setEditCustomFloorPlanUrl2('')}
                                className="text-neutral-400 hover:text-red-500 text-xs flex items-center gap-0.5"
                                title="Reset to default unit floor plan"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{editCustomFloorPlanUrl2 || proposal?.unit?.floorPlanUrl2}</p>
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: editCustomFloorPlanUrl2 || proposal?.unit?.floorPlanUrl2, title: 'Floor Plan Image 2' })}
                            className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Floor Plan 2
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Plan */}
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Label className="text-sm font-semibold whitespace-nowrap">Payment Plan:</Label>
                    <select
                      value={editPaymentPlanName}
                      onChange={e => {
                        const name = e.target.value
                        setEditPaymentPlanName(name)
                        const allPlans = [
                          ...(currentUnit?.paymentPlans || []),
                          ...(projectPlans || [])
                        ].filter((p, i, self) => self.findIndex(pl => pl.name === p.name) === i)
                        const found = allPlans.find(p => p.name === name)
                        if (found && found.schedule) {
                          try {
                            let parsed = typeof found.schedule === 'string' ? JSON.parse(found.schedule) : found.schedule
                            if (Array.isArray(parsed)) {
                              setEditPaymentPlan(parsed.map((s: any, idx: number) => ({
                                id: Date.now() + idx,
                                milestone: s.milestone || s.label || s.name || '',
                                percentage: Number(s.percentage) || 0,
                                date: s.date || '',
                                subMilestones: Array.isArray(s.subMilestones) ? s.subMilestones.map((sub: any, subIdx: number) => ({
                                  id: Date.now() + 1000 + idx * 10 + subIdx,
                                  milestone: sub.milestone || '',
                                  percentage: Number(sub.percentage) || 0,
                                  date: sub.date || ''
                                })) : []
                              })))
                            }
                          } catch(err) {
                            console.error(err)
                          }
                        }
                      }}
                      className="flex h-9 w-full sm:max-w-xs rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="Custom Plan">Custom Plan</option>
                      {[
                        ...(currentUnit?.paymentPlans || []),
                        ...(projectPlans || [])
                      ].filter((p, i, self) => self.findIndex(pl => pl.name === p.name) === i).map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditPaymentPlanName('Custom Plan')
                      setEditPaymentPlan([...editPaymentPlan, { id: Date.now(), milestone: '', percentage: 0, date: '' }])
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Milestone
                  </Button>
                </div>

                {editPaymentPlan.length > 0 && (
                  <div className="rounded-lg border border-neutral-200 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">Milestone Name</th>
                          <th className="px-3 py-2 text-center w-20">%</th>
                          <th className="px-3 py-2 text-center w-32">Date</th>
                          <th className="px-3 py-2 text-right w-28">Amount USD</th>
                          <th className="px-3 py-2 text-right w-28">Amount AED</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editPaymentPlan.flatMap((p, idx) => {
                          const baseForCalc = editCustomPrice ? Number(editCustomPrice) : (editSelectedPriceVal * (1 - (editDiscount ? Number(editDiscount) / 100 : 0)))
                          const amtUSD = (baseForCalc * (Number(p.percentage) || 0)) / 100
                          const amtAED = amtUSD * USD_TO_AED
                          
                          const rows = []
                          
                          rows.push(
                            <tr key={p.id} className="border-t border-neutral-200 bg-white">
                              <td className="px-3 py-2 text-neutral-500 font-semibold text-xs">{idx + 1}</td>
                              <td className="px-2 py-1.5 flex flex-col gap-1">
                                <input
                                  type="text"
                                  placeholder="e.g. Down Payment"
                                  value={p.milestone}
                                  onChange={e => { const n = [...editPaymentPlan]; n[idx].milestone = e.target.value; setEditPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm font-semibold rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                                <div className="flex flex-col gap-1 px-2">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const n = [...editPaymentPlan]
                                      if (!n[idx].subMilestones) n[idx].subMilestones = []
                                      n[idx].subMilestones.push({ id: Date.now(), milestone: '', percentage: 0, date: '' })
                                      setEditPaymentPlan(n)
                                    }}
                                    className="text-[10px] text-blue-600 text-left hover:underline"
                                  >
                                    + Add Sub-milestone
                                  </button>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] text-neutral-400">Divide into:</span>
                                    <input
                                      type="number"
                                      min="2"
                                      max="100"
                                      placeholder="Qty"
                                      value={divideInputs[p.id] || ''}
                                      onChange={e => setDivideInputs({ ...divideInputs, [p.id]: e.target.value })}
                                      className="w-10 px-1 py-0.5 text-[10px] rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const qtyStr = divideInputs[p.id]
                                        const qty = parseInt(qtyStr, 10)
                                        if (!qty || qty <= 1) {
                                          toast.error("Please enter 2 or more installments")
                                          return
                                        }
                                        const distributePercentage = (n: number): number[] => {
                                          const pct = Number((100 / n).toFixed(2))
                                          const list = Array(n).fill(pct)
                                          const sum = Number(list.reduce((a, b) => a + b, 0).toFixed(2))
                                          if (sum !== 100) {
                                            const diff = Number((100 - sum).toFixed(2))
                                            list[list.length - 1] = Number((list[list.length - 1] + diff).toFixed(2))
                                          }
                                          return list
                                        }
                                        const pcts = distributePercentage(qty)
                                        const n = [...editPaymentPlan]
                                        const milestoneName = n[idx].milestone || `Milestone ${idx + 1}`
                                        n[idx].subMilestones = pcts.map((pct, subIdx) => ({
                                          id: Date.now() + subIdx,
                                          milestone: `${milestoneName} - Installment ${subIdx + 1}`,
                                          percentage: pct,
                                          date: ''
                                        }))
                                        setEditPaymentPlan(n)
                                        setDivideInputs({ ...divideInputs, [p.id]: '' })
                                      }}
                                      className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 hover:bg-red-100 font-semibold"
                                    >
                                      Divide
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="number"
                                  placeholder="0"
                                  min={0}
                                  max={100}
                                  value={p.percentage || ''}
                                  onChange={e => { const n = [...editPaymentPlan]; n[idx].percentage = Number(e.target.value); setEditPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 text-center font-semibold"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. On Signing"
                                  value={p.date}
                                  onChange={e => { const n = [...editPaymentPlan]; n[idx].date = e.target.value; setEditPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 text-center font-semibold"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  value={amtUSD > 0 ? Math.round(amtUSD) : ''}
                                  onChange={e => {
                                    const amt = Number(e.target.value)
                                    const n = [...editPaymentPlan]
                                    if (baseForCalc > 0) {
                                      n[idx].percentage = Number(((amt / baseForCalc) * 100).toFixed(2))
                                    } else {
                                      n[idx].percentage = 0
                                    }
                                    setEditPaymentPlan(n)
                                  }}
                                  className="w-full px-2 py-1 text-sm rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 text-right font-semibold"
                                />
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-neutral-700 font-semibold">
                                {amtAED > 0 ? amtAED.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setEditPaymentPlan(editPaymentPlan.filter(x => x.id !== p.id))}
                                  className="text-neutral-300 hover:text-red-500 transition-colors text-lg font-bold leading-none"
                                  title="Remove Main Milestone"
                                >×</button>
                              </td>
                            </tr>
                          )
                          
                          if (p.subMilestones && p.subMilestones.length > 0) {
                            const subSum = p.subMilestones.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0)
                            p.subMilestones.forEach((sub, subIdx) => {
                              const subAmtUSD = (amtUSD * (Number(sub.percentage) || 0)) / 100
                              const subAmtAED = subAmtUSD * USD_TO_AED
                              rows.push(
                                <tr key={sub.id} className="border-t border-neutral-100 bg-neutral-50/50">
                                  <td className="px-3 py-2 text-neutral-400 text-[10px] text-right">{idx + 1}.{subIdx + 1}</td>
                                  <td className="px-2 py-1.5 pl-6">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 border-t border-neutral-300"></div>
                                      <input
                                        type="text"
                                        placeholder="e.g. 1st Installment"
                                        value={sub.milestone}
                                        onChange={e => { const n = [...editPaymentPlan]; n[idx].subMilestones![subIdx].milestone = e.target.value; setEditPaymentPlan(n) }}
                                        className="w-full px-2 py-1 text-xs rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      placeholder="0"
                                      min={0}
                                      max={100}
                                      value={sub.percentage || ''}
                                      onChange={e => { const n = [...editPaymentPlan]; n[idx].subMilestones![subIdx].percentage = Number(e.target.value); setEditPaymentPlan(n) }}
                                      className="w-full px-2 py-1 text-xs rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center bg-white"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      placeholder="e.g. After 3 Months"
                                      value={sub.date}
                                      onChange={e => { const n = [...editPaymentPlan]; n[idx].subMilestones![subIdx].date = e.target.value; setEditPaymentPlan(n) }}
                                      className="w-full px-2 py-1 text-xs rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center bg-white"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      placeholder="Amount"
                                      value={subAmtUSD > 0 ? Math.round(subAmtUSD) : ''}
                                      onChange={e => {
                                        const amt = Number(e.target.value)
                                        const n = [...editPaymentPlan]
                                        if (amtUSD > 0) {
                                          n[idx].subMilestones![subIdx].percentage = Number(((amt / amtUSD) * 100).toFixed(2))
                                        } else {
                                          n[idx].subMilestones![subIdx].percentage = 0
                                        }
                                        setEditPaymentPlan(n)
                                      }}
                                      className="w-full px-2 py-1 text-xs rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-right bg-white font-semibold text-neutral-800"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right text-xs text-neutral-500">
                                    {subAmtAED > 0 ? subAmtAED.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => { const n = [...editPaymentPlan]; n[idx].subMilestones = n[idx].subMilestones!.filter(x => x.id !== sub.id); setEditPaymentPlan(n) }}
                                      className="text-neutral-300 hover:text-red-500 transition-colors text-base font-bold leading-none"
                                      title="Remove Sub-milestone"
                                    >×</button>
                                  </td>
                                </tr>
                              )
                            })
                            if (subSum > 100) {
                              rows.push(
                                <tr key={`sub-warn-${p.id}`} className="bg-red-50 border-t border-red-200">
                                  <td colSpan={7} className="px-4 py-1.5 text-xs text-red-700 font-semibold">
                                    ⚠️ Sub-milestones for "{p.milestone || `Milestone ${idx + 1}`}" total {subSum}%. Sub-milestones percentage cannot exceed 100%.
                                  </td>
                                </tr>
                              )
                            }
                          }
                          
                          return rows
                        })}
                      </tbody>
                      <tfoot className="bg-neutral-50 border-t border-neutral-200 text-xs">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-neutral-600 font-semibold">Total</td>
                          <td className={`px-3 py-2 text-center font-bold ${editPaymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {editPaymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0)}%
                          </td>
                          <td colSpan={4} className="px-3 py-2 text-right">
                            {editPaymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) > 100 && (
                              <span className="text-red-600 font-semibold">⚠️ Cannot exceed 100%</span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Proposal Template Selector */}
              {templates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <Label className="font-semibold text-neutral-800">Proposal Template (Optional)</Label>
                  <select 
                    value={editTemplateId || ''} 
                    onChange={e => setEditTemplateId(e.target.value ? Number(e.target.value) : null)}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Select a Template...</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} {t.isDefault ? '(Default)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Image Selection */}
              {availableImages.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Selected Images ({editSelectedImages.length} selected)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableImages.map((img: any) => (
                      <button key={img.id} type="button"
                        onClick={() => setEditSelectedImages(prev => prev.includes(img.url) ? prev.filter(u => u !== img.url) : [...prev, img.url])}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${editSelectedImages.includes(img.url) ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-200'}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {editSelectedImages.includes(img.url) && (
                          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-red-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || editPaymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) > 100} className="bg-red-600 hover:bg-red-700">
                {editMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Property Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{snapshot.project?.name || 'Project'}</h3>
                  <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {snapshot.project?.city}, {snapshot.project?.country}</p>
                  {snapshot.unit?.towerBlock && <p className="text-xs text-neutral-400 mt-0.5">Tower/Block: {snapshot.unit.towerBlock}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
                <div><p className="text-xs text-neutral-500">Unit</p><p className="font-medium">{snapshot.unit?.unitNumber}</p></div>
                <div><p className="text-xs text-neutral-500">Type</p><p className="font-medium capitalize">{snapshot.unit?.type?.toLowerCase()}</p></div>
                <div><p className="text-xs text-neutral-500">Size</p><p className="font-medium">{snapshot.unit?.size} m²</p></div>
                <div><p className="text-xs text-neutral-500">Beds / Baths</p><p className="font-medium">{snapshot.unit?.bedrooms} / {snapshot.unit?.bathrooms}</p></div>
              </div>
              {snapshot.unit?.condition && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500">Unit Condition</p>
                  <p className="font-medium text-sm">{snapshot.unit.condition}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Financials</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Base Price</span>
                  <span className="font-medium">{basePrice.toLocaleString()} {snapshot.unit?.currency}</span>
                </div>
                {proposal.discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({proposal.discountPercent}%)</span>
                    <span>- {((basePrice * proposal.discountPercent) / 100).toLocaleString()} {snapshot.unit?.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-neutral-100">
                  <span>Final Offer (USD)</span>
                  <span className="text-red-600">{finalPriceNum.toLocaleString('en-US', { maximumFractionDigits: 0 })} {snapshot.unit?.currency}</span>
                </div>
                <div className="flex justify-between text-sm text-neutral-500">
                  <span>Final Offer (AED)</span>
                  <span>{(finalPriceNum * USD_TO_AED).toLocaleString('en-US', { maximumFractionDigits: 0 })} AED</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Plan Summary */}
          {Array.isArray(snapshot.customPaymentPlan) && snapshot.customPaymentPlan.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">Payment Plan</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Milestone</th>
                      <th className="px-4 py-2 text-center">%</th>
                      <th className="px-4 py-2 text-center">Date</th>
                      <th className="px-4 py-2 text-right">USD</th>
                      <th className="px-4 py-2 text-right">AED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.customPaymentPlan.flatMap((m: any, i: number) => {
                      const amtUSD = (finalPriceNum * m.percentage) / 100
                      const rows = []
                      rows.push(
                        <tr key={i} className="border-t border-neutral-200 bg-white">
                          <td className="px-4 py-2 text-neutral-500 font-semibold text-xs">{i + 1}</td>
                          <td className="px-4 py-2 font-semibold">{m.milestone}</td>
                          <td className="px-4 py-2 text-center font-semibold">{m.percentage}%</td>
                          <td className="px-4 py-2 text-center text-neutral-500 font-medium">{m.date}</td>
                          <td className="px-4 py-2 text-right font-semibold">{amtUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="px-4 py-2 text-right font-semibold">{(amtUSD * USD_TO_AED).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      )
                      if (m.subMilestones && m.subMilestones.length > 0) {
                        m.subMilestones.forEach((sub: any, subIdx: number) => {
                          const subAmtUSD = (amtUSD * (Number(sub.percentage) || 0)) / 100
                          rows.push(
                            <tr key={`${i}-${subIdx}`} className="border-t border-neutral-100 bg-neutral-50/60">
                              <td className="px-4 py-1.5 text-neutral-400 text-[10px] text-right">{i + 1}.{subIdx + 1}</td>
                              <td className="px-4 py-1.5 text-neutral-500 pl-8"><span className="text-neutral-300 mr-1">-</span>{sub.milestone}</td>
                              <td className="px-4 py-1.5 text-center text-neutral-500">{sub.percentage}%</td>
                              <td className="px-4 py-1.5 text-center text-neutral-400">{sub.date}</td>
                              <td className="px-4 py-1.5 text-right text-neutral-500">{subAmtUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                              <td className="px-4 py-1.5 text-right text-neutral-400">{(subAmtUSD * USD_TO_AED).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                            </tr>
                          )
                        })
                      }
                      return rows
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {proposal.customerMessage && (
            <Card className="shadow-sm bg-neutral-50">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-neutral-500 mb-2">Message to Customer</p>
                <p className="text-sm italic text-neutral-700 whitespace-pre-wrap">"{proposal.customerMessage}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
                <div>
                  <p className="font-semibold">{proposal.customer?.name}</p>
                  <p className="text-xs text-neutral-500">{proposal.customer?.email}</p>
                  <p className="text-xs text-neutral-500">{proposal.customer?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {proposal.status === 'DRAFT' && (
                <Button onClick={() => updateStatusMutation.mutate('SENT')} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" /> Mark as Sent
                </Button>
              )}
              {(proposal.status === 'SENT' || proposal.status === 'VIEWED') && (
                <>
                  <Button onClick={() => updateStatusMutation.mutate('ACCEPTED')} className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Accepted
                  </Button>
                  <Button onClick={() => updateStatusMutation.mutate('REJECTED')} variant="outline" className="w-full text-red-600 hover:text-red-700">
                    Mark Rejected
                  </Button>
                </>
              )}
              {proposal.status === 'ACCEPTED' && (
                <div className="p-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center border border-green-200">
                  Proposal Accepted 🎉
                </div>
              )}
              <a href={`/proposals/${id}/template`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full mt-3">
                  <FileText className="w-4 h-4 mr-2" /> View HTML Template
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-neutral-900 text-base">{previewImage.title || 'Floor Plan Preview'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <ExternalLink className="w-4 h-4" /> Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-neutral-950/5">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md border border-neutral-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
