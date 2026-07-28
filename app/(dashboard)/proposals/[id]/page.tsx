'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Download, Send, CheckCircle, FileText, User, Building2, MapPin, Pencil, Plus, Trash2, X, Check } from 'lucide-react'
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
  const [editPaymentPlan, setEditPaymentPlan] = useState<{ id: number, milestone: string, percentage: number, date: string }[]>([])
  const [editSelectedImages, setEditSelectedImages] = useState<string[]>([])

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
  }, [proposal])

  // Project media for image picker
  const snap = proposal?.snapshot as any
  const projectId = snap?.project?.id
  const { data: projectMedia = [] } = useQuery({
    queryKey: ['media', projectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${projectId}/media`)).json(),
    enabled: !!projectId && isEditing
  })
  const availableImages = [
    ...projectMedia.filter((m: any) => m.type === 'IMAGE'),
    ...(snap?.unit?.floorPlanUrl ? [{ id: 'floorplan', url: snap.unit.floorPlanUrl }] : [])
  ]

  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      // Open the template in a new tab with ?print=1 — browser auto-triggers print dialog
      const templateUrl = `/proposals/${id}/template?print=1`
      window.open(templateUrl, '_blank')
    },
    onSuccess: () => toast.success('Print dialog opened — choose "Save as PDF"'),
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
  const basePrice = Number(snapshot.unit?.price || 0)
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal for {proposal.customer?.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">Created on {new Date(proposal.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold">Edit Proposal</h2>
              <button onClick={() => setIsEditing(false)} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Pricing */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Pricing</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Custom Price (USD)</Label>
                    <Input type="number" placeholder={String(basePrice)} value={editCustomPrice} onChange={e => setEditCustomPrice(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Discount (%)</Label>
                    <Input type="number" min={0} max={50} placeholder="0" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} disabled={!!editCustomPrice} />
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Property Info</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Tower/Block</Label>
                    <Input placeholder="e.g. Tower A" value={editTowerBlock} onChange={e => setEditTowerBlock(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-neutral-500">Unit Condition</Label>
                    <Input placeholder="e.g. White Frame" value={editUnitCondition} onChange={e => setEditUnitCondition(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Message & Notes */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Message to Customer</Label>
                  <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={3}
                    className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Internal Notes (private)</Label>
                  <Input placeholder="Notes not shown in PDF" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                </div>
              </div>

              {/* Payment Plan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Detailed Payment Plan</Label>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setEditPaymentPlan([...editPaymentPlan, { id: Date.now(), milestone: '', percentage: 0, date: '' }])}>
                    <Plus className="w-3 h-3 mr-1" /> Add Milestone
                  </Button>
                </div>
                {editPaymentPlan.length > 0 && (
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 text-xs text-neutral-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">#</th>
                          <th className="px-3 py-2 text-left">Milestone</th>
                          <th className="px-3 py-2 text-center w-16">%</th>
                          <th className="px-3 py-2 text-center w-28">Date</th>
                          <th className="px-3 py-2 text-right w-24">USD</th>
                          <th className="px-3 py-2 text-right w-24">AED</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editPaymentPlan.map((p, idx) => {
                          const amtUSD = (editBasePrice * (Number(p.percentage) || 0)) / 100
                          const amtAED = amtUSD * USD_TO_AED
                          return (
                            <tr key={p.id} className="border-t border-neutral-100">
                              <td className="px-3 py-1.5 text-neutral-400 text-xs">{idx + 1}</td>
                              <td className="px-2 py-1.5">
                                <input type="text" placeholder="e.g. Down Payment" value={p.milestone}
                                  onChange={e => { const n = [...editPaymentPlan]; n[idx].milestone = e.target.value; setEditPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number" placeholder="0" min={0} max={100} value={p.percentage || ''}
                                  onChange={e => { const n = [...editPaymentPlan]; n[idx].percentage = Number(e.target.value); setEditPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="text" placeholder="On Signing" value={p.date}
                                  onChange={e => { const n = [...editPaymentPlan]; n[idx].date = e.target.value; setEditPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center" />
                              </td>
                              <td className="px-3 py-1.5 text-right text-xs font-medium">{amtUSD > 0 ? amtUSD.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}</td>
                              <td className="px-3 py-1.5 text-right text-xs">{amtAED > 0 ? amtAED.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}</td>
                              <td className="px-2 py-1.5 text-center">
                                <button type="button" onClick={() => setEditPaymentPlan(editPaymentPlan.filter(x => x.id !== p.id))}
                                  className="text-neutral-300 hover:text-red-500 transition-colors text-lg font-bold leading-none">×</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-neutral-50 border-t border-neutral-200 text-xs">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-neutral-500">Total</td>
                          <td className={`px-3 py-2 text-center font-semibold ${editPaymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {editPaymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0)}%
                          </td>
                          <td colSpan={4}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

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
              <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} className="bg-red-600 hover:bg-red-700">
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
                    {snapshot.customPaymentPlan.map((m: any, i: number) => {
                      const amtUSD = (finalPriceNum * m.percentage) / 100
                      return (
                        <tr key={i} className="border-t border-neutral-100">
                          <td className="px-4 py-2 text-neutral-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium">{m.milestone}</td>
                          <td className="px-4 py-2 text-center">{m.percentage}%</td>
                          <td className="px-4 py-2 text-center text-neutral-500">{m.date}</td>
                          <td className="px-4 py-2 text-right">{amtUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="px-4 py-2 text-right">{(amtUSD * USD_TO_AED).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      )
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
              <Link href={`/proposals/${id}/template`} target="_blank">
                <Button variant="outline" className="w-full mt-3">
                  <FileText className="w-4 h-4 mr-2" /> View HTML Template
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
