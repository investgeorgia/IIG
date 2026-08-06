'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2, Check, FileText, Plus, Search, User, Mail, Phone, Building, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

type Step = 1 | 2 | 3 | 4

export default function CreateProposalPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Selections
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', email: '', phone: '', nationality: '', source: '' })
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<any>(null)

  // Customizations
  const [customPrice, setCustomPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [notes, setNotes] = useState('')
  const [customerMessage, setCustomerMessage] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  
  // New Customizations
  const [towerBlock, setTowerBlock] = useState('')
  const [unitCondition, setUnitCondition] = useState('')
  const [paymentPlan, setPaymentPlan] = useState<{ id: number, milestone: string, percentage: number, date: string, subMilestones?: { id: number, milestone: string, percentage: number, date: string }[] }[]>([])
  const [customFloorPlanUrl, setCustomFloorPlanUrl] = useState('')
  const [floorPlanUploading, setFloorPlanUploading] = useState(false)
  const [selectedPriceVal, setSelectedPriceVal] = useState<number>(0)
  const [selectedPricingType, setSelectedPricingType] = useState<string>('Base Price')
  const [selectedPaymentPlanName, setSelectedPaymentPlanName] = useState<string>('Standard Plan')

  // Data queries
  const { data: searchResults = [], isFetching: isSearchingCustomers } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: async () => {
      const res = await fetch(`/api/cms/customers/search?q=${encodeURIComponent(customerSearch)}`)
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    enabled: true,
    staleTime: 0,
  })

  const { data: developers = [] } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => (await fetch('/api/cms/developers')).json()
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-published', selectedDeveloperId],
    queryFn: async () => {
      const res = await fetch('/api/cms/projects')
      const all = await res.json()
      return all.filter((p: any) => (!selectedDeveloperId || p.developerId === selectedDeveloperId))
    },
    enabled: !!selectedDeveloperId
  })

  const { data: units = [] } = useQuery({
    queryKey: ['units', selectedProjectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${selectedProjectId}/units`)).json(),
    enabled: !!selectedProjectId
  })

  const { data: projectMedia = [] } = useQuery({
    queryKey: ['media', selectedProjectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${selectedProjectId}/media`)).json(),
    enabled: !!selectedProjectId && step === 4
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await fetch('/api/cms/templates')).json(),
    enabled: step === 4
  })

  // Auto-select default database template when templates load
  useEffect(() => {
    const templatesArr = Array.isArray(templates) ? templates : []
    if (templatesArr.length > 0 && selectedTemplateId === null) {
      const def = templatesArr.find((t: any) => t.isDefault) || templatesArr[0]
      if (def) setSelectedTemplateId(def.id)
    }
  }, [templates, selectedTemplateId])

  // Create customer then proposal
  const createProposalMutation = useMutation({
    mutationFn: async () => {
      let customerId = selectedCustomer?.id

      if (isNewCustomer) {
        const custRes = await fetch('/api/cms/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomerForm)
        })
        if (!custRes.ok) throw new Error('Failed to create customer')
        const cust = await custRes.json()
        customerId = cust.id
      }

      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          unitId: selectedUnit.id,
          templateId: selectedTemplateId || undefined,
          customPrice: customPrice ? Number(customPrice) : undefined,
          discountPercent: discountPercent ? Number(discountPercent) : undefined,
          notes,
          customerMessage,
          selectedImages,
          towerBlock,
          unitCondition,
          paymentPlan,
          customFloorPlanUrl: customFloorPlanUrl || undefined,
          pricingType: selectedPricingType,
          selectedPrice: selectedPriceVal,
          paymentPlanName: selectedPaymentPlanName
        })
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: (proposal) => {
      toast.success('Proposal created!')
      router.push(`/proposals/${proposal.id}`)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const images = (Array.isArray(projectMedia) ? projectMedia : []).filter((m: any) => m.type === 'IMAGE')
  
  if (selectedUnit?.floorPlanUrl && !images.find((m: any) => m.url === selectedUnit.floorPlanUrl)) {
    images.push({ id: 'floorplan', url: selectedUnit.floorPlanUrl, type: 'IMAGE' })
  }

  const toggleImage = (url: string) => {
    setSelectedImages(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url])
  }

  const getInitials = (name: string) => {
    if (!name) return 'C'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

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
        setCustomFloorPlanUrl(data.url)
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">New Proposal</h1>
        <p className="text-neutral-500 mt-1">Follow the steps to build a customized, professional sales proposal.</p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { s: 1, title: 'Customer', desc: 'Select or add customer' },
            { s: 2, title: 'Property', desc: 'Select developer & project' },
            { s: 3, title: 'Unit', desc: 'Select available unit' },
            { s: 4, title: 'Customize', desc: 'Price, options & summary' },
          ].map((item, idx) => {
            const isCompleted = step > item.s
            const isCurrent = step === item.s

            return (
              <div key={item.s} className="flex-1 flex items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-sm ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-red-600 text-white ring-4 ring-red-100' :
                    'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : item.s}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-sm font-semibold leading-none ${isCurrent ? 'text-neutral-900' : isCompleted ? 'text-green-700' : 'text-neutral-400'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 font-normal">{item.desc}</p>
                  </div>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors ${step > item.s ? 'bg-green-500' : 'bg-neutral-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── STEP 1: CUSTOMER ─── */}
      {step === 1 && (
        <Card className="shadow-sm border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl">Select or Create Customer</CardTitle>
            <CardDescription>Choose an existing customer lead or enter new customer details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="inline-flex p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() => setIsNewCustomer(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${!isNewCustomer ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setIsNewCustomer(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${isNewCustomer ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                New Customer
              </button>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerSearch" className="font-semibold text-neutral-800">Search Lead by Name, Email, or Phone</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                    <Input
                      id="customerSearch"
                      placeholder="Start typing name, email or phone number..."
                      value={customerSearch}
                      onChange={e => {
                        setCustomerSearch(e.target.value)
                        if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                          setSelectedCustomer(null)
                        }
                      }}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white font-semibold flex items-center justify-center text-sm">
                        {getInitials(selectedCustomer.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 text-base flex items-center gap-2">
                          {selectedCustomer.name}
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Selected</span>
                        </p>
                        <p className="text-xs text-neutral-600 flex items-center gap-3 mt-0.5">
                          {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedCustomer.email}</span>}
                          {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedCustomer.phone}</span>}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700 font-medium" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}>
                      Change Selection
                    </Button>
                  </div>
                ) : (
                  <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {customerSearch ? `Search Results for "${customerSearch}"` : 'Recent Customers / Leads'}
                    </div>

                    {isSearchingCustomers ? (
                      <div className="p-8 text-center text-sm text-neutral-500 flex justify-center items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Searching customer database...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                        {searchResults.map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name) }}
                            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-red-50/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-700 group-hover:bg-red-100 group-hover:text-red-700 font-semibold flex items-center justify-center text-xs transition-colors">
                                {getInitials(c.name)}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-neutral-900 group-hover:text-red-700 transition-colors">{c.name}</p>
                                <p className="text-xs text-neutral-500 flex items-center gap-3">
                                  {c.email && <span>{c.email}</span>}
                                  {c.phone && <span>· {c.phone}</span>}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-neutral-400 group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                              Select →
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center space-y-2">
                        <p className="text-sm font-medium text-neutral-700">No matching customers found</p>
                        <p className="text-xs text-neutral-400">Try searching a different name, email or phone number, or switch to "New Customer".</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1"><Label>Full Name *</Label><Input placeholder="Customer name" value={newCustomerForm.name} onChange={e => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Email</Label><Input type="email" placeholder="customer@example.com" value={newCustomerForm.email} onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} /></div>
                <div className="space-y-1"><Label>Phone</Label><Input placeholder="+971 50 123 4567" value={newCustomerForm.phone} onChange={e => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} /></div>
                <div className="space-y-1"><Label>Nationality</Label><Input placeholder="e.g. UAE, UAE / Expat" value={newCustomerForm.nationality} onChange={e => setNewCustomerForm({ ...newCustomerForm, nationality: e.target.value })} /></div>
                <div className="space-y-1 md:col-span-2"><Label>Lead Source</Label>
                  <select value={newCustomerForm.source} onChange={e => setNewCustomerForm({ ...newCustomerForm, source: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-red-500">
                    <option value="">Select Lead Source...</option>
                    {['Direct','Instagram','Facebook','Referral','Walk-in','Website','Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <Button
                onClick={() => setStep(2)}
                disabled={!isNewCustomer ? !selectedCustomer : !newCustomerForm.name}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6"
              >
                Next: Select Property <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 2: DEVELOPER + PROJECT ─── */}
      {step === 2 && (
        <Card className="shadow-sm border-neutral-200">
          <CardHeader><CardTitle className="text-xl">Select Developer & Project</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label className="font-semibold text-neutral-800">Developer *</Label>
              <select value={selectedDeveloperId || ''} onChange={e => { setSelectedDeveloperId(Number(e.target.value)); setSelectedProjectId(null); setSelectedUnit(null) }}
                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-red-500">
                <option value="">Select developer...</option>
                {developers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {selectedDeveloperId && (
              <div className="space-y-3">
                <Label className="font-semibold text-neutral-800">Published Projects</Label>
                {projects.length === 0 ? (
                  <p className="text-sm text-neutral-500">No published projects for this developer.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => { setSelectedProjectId(p.id); setSelectedUnit(null) }}
                        className={`flex items-start p-4 rounded-xl border-2 text-left transition-all ${selectedProjectId === p.id ? 'border-red-500 bg-red-50/50 shadow-sm' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}>
                        <div className="flex-1">
                          <p className="font-semibold text-base text-neutral-900">{p.name}</p>
                          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1"><Building className="w-3 h-3" /> {p.city}, {p.country}</p>
                        </div>
                        {selectedProjectId === p.id && <Check className="w-5 h-5 text-red-600 mt-1" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-neutral-100">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedProjectId} className="bg-red-600 hover:bg-red-700 text-white">
                Next: Select Unit <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 3: UNIT ─── */}
      {step === 3 && (
        <Card className="shadow-sm border-neutral-200">
          <CardHeader><CardTitle className="text-xl">Select Unit</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {units.filter((u: any) => u.status === 'AVAILABLE').length === 0 ? (
              <p className="text-neutral-500 text-sm">No available units in this project.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {units.filter((u: any) => u.status === 'AVAILABLE').map((unit: any) => (
                  <button key={unit.id} type="button" onClick={() => {
                    setSelectedUnit(unit)
                    setSelectedPriceVal(Number(unit.price))
                    setSelectedPricingType('Base Price')
                    const plan = (unit.paymentPlans && unit.paymentPlans.length > 0) ? unit.paymentPlans[0] : (projects.find((p: any) => p.id === selectedProjectId)?.paymentPlans?.[0])
                    setSelectedPaymentPlanName(plan ? plan.name : 'Standard Plan')
                    if (plan && plan.schedule) {
                      try {
                        let parsedSchedule = typeof plan.schedule === 'string' ? JSON.parse(plan.schedule) : plan.schedule;
                        if (Array.isArray(parsedSchedule)) {
                          setPaymentPlan(parsedSchedule.map((s: any, idx: number) => ({
                            id: Date.now() + idx,
                            milestone: s.milestone || s.label || s.name || '',
                            percentage: Number(s.percentage) || 0,
                            date: s.date || (s.dueDays ? `Due in ${s.dueDays} days` : ''),
                            subMilestones: Array.isArray(s.subMilestones) ? s.subMilestones.map((sub: any, subIdx: number) => ({
                              id: Date.now() + 1000 + idx * 10 + subIdx,
                              milestone: sub.milestone || '',
                              percentage: Number(sub.percentage) || 0,
                              date: sub.date || ''
                            })) : []
                          })))
                        } else {
                          setPaymentPlan([])
                        }
                      } catch (e) {
                        console.error('Failed to parse schedule', e)
                        setPaymentPlan([])
                      }
                    } else {
                      setPaymentPlan([])
                    }
                  }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedUnit?.id === unit.id ? 'border-red-500 bg-red-50/50 shadow-sm' : 'border-neutral-200 hover:border-neutral-300 bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-base text-neutral-900">Unit {unit.unitNumber}</span>
                      {selectedUnit?.id === unit.id && <Check className="w-5 h-5 text-red-600" />}
                    </div>
                    {unit.floorPlanUrl && (
                      <div className="mb-3 h-28 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200">
                        <img src={unit.floorPlanUrl} alt="Floor plan" className="w-full h-full object-cover opacity-80" />
                      </div>
                    )}
                    <p className="text-xs text-neutral-500 capitalize">{unit.type.toLowerCase()} · {unit.bedrooms} bed · {unit.bathrooms} bath</p>
                    <p className="text-xs text-neutral-500">{Number(unit.size).toLocaleString()} m²{unit.floor ? ` · Floor ${unit.floor}` : ''}</p>
                    <p className="text-base font-bold text-neutral-900 mt-2">{Number(unit.price).toLocaleString()} {unit.currency}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-neutral-100">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button onClick={() => setStep(4)} disabled={!selectedUnit} className="bg-red-600 hover:bg-red-700 text-white">
                Next: Customize <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 4: CUSTOMIZE & GENERATE ─── */}
      {step === 4 && selectedUnit && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="shadow-sm bg-neutral-50 border-neutral-200">
            <CardContent className="p-5">
              <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider mb-3">Proposal Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-neutral-500 text-xs">Customer</p><p className="font-semibold text-neutral-900">{selectedCustomer?.name || newCustomerForm.name}</p></div>
                <div><p className="text-neutral-500 text-xs">Unit</p><p className="font-semibold text-neutral-900">{selectedUnit.unitNumber}</p></div>
                <div><p className="text-neutral-500 text-xs">Base Price</p><p className="font-semibold text-neutral-900">{Number(selectedUnit.price).toLocaleString()} {selectedUnit.currency}</p></div>
                <div><p className="text-neutral-500 text-xs">Size</p><p className="font-semibold text-neutral-900">{Number(selectedUnit.size).toLocaleString()} m²</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-neutral-200">
            <CardHeader><CardTitle className="text-xl">Customizations</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Pricing Type</Label>
                  <select
                    value={selectedPriceVal}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setSelectedPriceVal(val)
                      if (val === Number(selectedUnit.price)) setSelectedPricingType('Base Price')
                      else if (val === Number(selectedUnit.blackFramePrice)) setSelectedPricingType('Black Frame')
                      else if (val === Number(selectedUnit.whiteFramePrice)) setSelectedPricingType('White Frame')
                      else if (val === Number(selectedUnit.greenFramePrice)) setSelectedPricingType('Green Frame')
                      else if (val === Number(selectedUnit.turnkeyPrice)) setSelectedPricingType('Turnkey')
                    }}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value={Number(selectedUnit.price)}>{Number(selectedUnit.price).toLocaleString()} USD</option>
                    {selectedUnit.blackFramePrice && <option value={Number(selectedUnit.blackFramePrice)}>{Number(selectedUnit.blackFramePrice).toLocaleString()} USD</option>}
                    {selectedUnit.whiteFramePrice && <option value={Number(selectedUnit.whiteFramePrice)}>{Number(selectedUnit.whiteFramePrice).toLocaleString()} USD</option>}
                    {selectedUnit.greenFramePrice && <option value={Number(selectedUnit.greenFramePrice)}>{Number(selectedUnit.greenFramePrice).toLocaleString()} USD</option>}
                    {selectedUnit.turnkeyPrice && <option value={Number(selectedUnit.turnkeyPrice)}>{Number(selectedUnit.turnkeyPrice).toLocaleString()} USD</option>}
                  </select>
                </div>
                <div className="space-y-1"><Label>Custom Price (optional)</Label><Input type="number" placeholder={String(selectedPriceVal)} value={customPrice} onChange={e => setCustomPrice(e.target.value)} /></div>
                <div className="space-y-1"><Label>Discount (%)</Label><Input type="number" min={0} max={50} placeholder="0" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Tower/Block</Label><Input placeholder="e.g. Tower A" value={towerBlock} onChange={e => setTowerBlock(e.target.value)} /></div>
                <div className="space-y-1"><Label>Unit Condition</Label><Input placeholder="e.g. Fully Renovated, White Frame" value={unitCondition} onChange={e => setUnitCondition(e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Message to Customer</Label><textarea value={customerMessage} onChange={e => setCustomerMessage(e.target.value)} rows={3} placeholder="Dear [customer name], it is our pleasure to present this exclusive offer..." className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Internal Notes</Label><Input placeholder="Private notes (not shown in PDF)..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Custom Floor Plan Image</Label>
                  <div className="flex gap-2">
                    <Input placeholder="URL or upload..." value={customFloorPlanUrl} onChange={e => setCustomFloorPlanUrl(e.target.value)} className="flex-1" />
                    <input type="file" id="custom-floor-upload" className="hidden" accept="image/*" onChange={handleFloorPlanUpload} />
                    <label htmlFor="custom-floor-upload" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-sm">
                      {floorPlanUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Label className="text-sm font-semibold whitespace-nowrap">Payment Plan:</Label>
                    <select
                      value={selectedPaymentPlanName}
                      onChange={e => {
                        const name = e.target.value
                        setSelectedPaymentPlanName(name)
                        const allPlans = [
                          ...(selectedUnit?.paymentPlans || []),
                          ...(projects.find((p: any) => p.id === selectedProjectId)?.paymentPlans || [])
                        ].filter((p, i, self) => self.findIndex(pl => pl.name === p.name) === i)
                        const found = allPlans.find(p => p.name === name)
                        if (found && found.schedule) {
                          try {
                            let parsed = typeof found.schedule === 'string' ? JSON.parse(found.schedule) : found.schedule
                            if (Array.isArray(parsed)) {
                              setPaymentPlan(parsed.map((s: any, idx: number) => ({
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
                        ...(selectedUnit?.paymentPlans || []),
                        ...(projects.find((p: any) => p.id === selectedProjectId)?.paymentPlans || [])
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
                      setSelectedPaymentPlanName('Custom Plan')
                      setPaymentPlan([...paymentPlan, { id: Date.now(), milestone: '', percentage: 0, date: '' }])
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Milestone
                  </Button>
                </div>
 
                {paymentPlan.length > 0 && (
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <table className="w-full text-sm">
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
                        {paymentPlan.flatMap((p, idx) => {
                          const baseForCalc = customPrice ? Number(customPrice) : (selectedPriceVal * (1 - (discountPercent ? Number(discountPercent) / 100 : 0)))
                          const amtUSD = (baseForCalc * (Number(p.percentage) || 0)) / 100
                          const amtAED = amtUSD * 3.6725
                          
                          const rows = []
                          
                          rows.push(
                            <tr key={p.id} className="border-t border-neutral-200 bg-white">
                              <td className="px-3 py-2 text-neutral-500 font-semibold text-xs">{idx + 1}</td>
                              <td className="px-2 py-1.5 flex flex-col gap-1">
                                <input
                                  type="text"
                                  placeholder="e.g. Down Payment"
                                  value={p.milestone}
                                  onChange={e => { const n = [...paymentPlan]; n[idx].milestone = e.target.value; setPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm font-semibold rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const n = [...paymentPlan]
                                    if (!n[idx].subMilestones) n[idx].subMilestones = []
                                    n[idx].subMilestones.push({ id: Date.now(), milestone: '', percentage: 0, date: '' })
                                    setPaymentPlan(n)
                                  }}
                                  className="text-[10px] text-blue-600 self-start hover:underline px-2"
                                >
                                  + Add Sub-milestone
                                </button>
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="number"
                                  placeholder="0"
                                  min={0}
                                  max={100}
                                  value={p.percentage || ''}
                                  onChange={e => { const n = [...paymentPlan]; n[idx].percentage = Number(e.target.value); setPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 text-center font-semibold"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  placeholder="e.g. On Signing"
                                  value={p.date}
                                  onChange={e => { const n = [...paymentPlan]; n[idx].date = e.target.value; setPaymentPlan(n) }}
                                  className="w-full px-2 py-1 text-sm rounded border border-transparent hover:border-neutral-200 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 text-center font-semibold"
                                />
                              </td>
                              <td className="px-3 py-2 text-right text-sm font-semibold text-neutral-800">
                                {amtUSD > 0 ? amtUSD.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-sm text-neutral-700 font-semibold">
                                {amtAED > 0 ? amtAED.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setPaymentPlan(paymentPlan.filter(x => x.id !== p.id))}
                                  className="text-neutral-300 hover:text-red-500 transition-colors text-lg font-bold leading-none"
                                  title="Remove Main Milestone"
                                >×</button>
                              </td>
                            </tr>
                          )
                          
                          if (p.subMilestones && p.subMilestones.length > 0) {
                            p.subMilestones.forEach((sub, subIdx) => {
                              const subAmtUSD = (amtUSD * (Number(sub.percentage) || 0)) / 100
                              const subAmtAED = subAmtUSD * 3.6725
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
                                        onChange={e => { const n = [...paymentPlan]; n[idx].subMilestones![subIdx].milestone = e.target.value; setPaymentPlan(n) }}
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
                                      onChange={e => { const n = [...paymentPlan]; n[idx].subMilestones![subIdx].percentage = Number(e.target.value); setPaymentPlan(n) }}
                                      className="w-full px-2 py-1 text-xs rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center bg-white"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      placeholder="e.g. After 3 Months"
                                      value={sub.date}
                                      onChange={e => { const n = [...paymentPlan]; n[idx].subMilestones![subIdx].date = e.target.value; setPaymentPlan(n) }}
                                      className="w-full px-2 py-1 text-xs rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-center bg-white"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-right text-xs text-neutral-600">
                                    {subAmtUSD > 0 ? subAmtUSD.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right text-xs text-neutral-500">
                                    {subAmtAED > 0 ? subAmtAED.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => { const n = [...paymentPlan]; n[idx].subMilestones = n[idx].subMilestones!.filter(x => x.id !== sub.id); setPaymentPlan(n) }}
                                      className="text-neutral-300 hover:text-red-500 transition-colors text-base font-bold leading-none"
                                      title="Remove Sub-milestone"
                                    >×</button>
                                  </td>
                                </tr>
                              )
                            })
                          }

                          return rows
                        })}
                      </tbody>
                      <tfoot className="bg-neutral-50 border-t border-neutral-200 text-xs">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-neutral-500">Total</td>
                          <td className={`px-3 py-2 text-center font-semibold ${paymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {paymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0)}%
                          </td>
                          <td colSpan={4}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Images for PDF ({selectedImages.length} selected)</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {images.map((img: any) => (
                      <button key={img.id} type="button" onClick={() => toggleImage(img.url)}
                        className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${selectedImages.includes(img.url) ? 'border-red-500 ring-2 ring-red-200' : 'border-neutral-200'}`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {selectedImages.includes(img.url) && (
                          <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-red-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {templates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <Label>Proposal Template (Optional)</Label>
                  <select 
                    value={selectedTemplateId || ''} 
                    onChange={e => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Select a Template...</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} {t.isDefault ? '(Default)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <Button onClick={() => createProposalMutation.mutate()} disabled={createProposalMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white px-6">
              {createProposalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Create Proposal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
