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

  // Unit Filters in Step 3
  const [unitSearch, setUnitSearch] = useState('')
  const [unitFilterType, setUnitFilterType] = useState('')
  const [unitFilterBeds, setUnitFilterBeds] = useState('')
  const [unitMinSize, setUnitMinSize] = useState('')
  const [unitMaxSize, setUnitMaxSize] = useState('')
  const [unitMinPrice, setUnitMinPrice] = useState('')
  const [unitMaxPrice, setUnitMaxPrice] = useState('')

  // Pagination State
  const [unitPage, setUnitPage] = useState(1)

  // Customizations
  const [customPrice, setCustomPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [notes, setNotes] = useState('')
  const [customerMessage, setCustomerMessage] = useState('Taking into consideration your preferences and key investment goals, we have carefully selected the following opportunity that aligns with your criteria and demonstrates exceptional growth potential.')
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
  const [customHandover, setCustomHandover] = useState<string>('')
  const [visibleFields, setVisibleFields] = useState<string[]>(['building', 'renovationPrice'])

  useEffect(() => {
    if (selectedUnit) {
      setCustomHandover(selectedUnit.handover ? new Date(selectedUnit.handover).toISOString().split('T')[0] : '')
    }
  }, [selectedUnit])

  useEffect(() => {
    setUnitPage(1)
  }, [
    unitSearch,
    unitFilterType,
    unitFilterBeds,
    unitMinSize,
    unitMaxSize,
    unitMinPrice,
    unitMaxPrice,
    selectedProjectId
  ])

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

  // Filtered units computation
  const filteredUnits = (Array.isArray(units) ? units : []).filter((u: any) => {
    if (u.status !== 'AVAILABLE') return false
    if (unitSearch && !String(u.unitNumber || '').toLowerCase().includes(unitSearch.toLowerCase())) return false
    if (unitFilterType && String(u.type || '').toUpperCase() !== unitFilterType.toUpperCase()) return false
    if (unitFilterBeds !== '') {
      const beds = Number(unitFilterBeds)
      if (beds >= 4) { if ((Number(u.bedrooms) || 0) < 4) return false }
      else if ((Number(u.bedrooms) || 0) !== beds) return false
    }
    if (unitMinSize && (Number(u.size) || 0) < Number(unitMinSize)) return false
    if (unitMaxSize && (Number(u.size) || 0) > Number(unitMaxSize)) return false
    if (unitMinPrice && (Number(u.price) || 0) < Number(unitMinPrice)) return false
    if (unitMaxPrice && (Number(u.price) || 0) > Number(unitMaxPrice)) return false
    return true
  })

  const UNITS_PER_PAGE = 12
  const totalPages = Math.ceil(filteredUnits.length / UNITS_PER_PAGE)
  const paginatedUnits = filteredUnits.slice((unitPage - 1) * UNITS_PER_PAGE, unitPage * UNITS_PER_PAGE)

  const { data: projectMedia = [] } = useQuery({
    queryKey: ['media', selectedProjectId],
    queryFn: async () => (await fetch(`/api/cms/projects/${selectedProjectId}/media`)).json(),
    enabled: !!selectedProjectId && step === 4
  })

  const projectFloorPlans = (Array.isArray(projectMedia) ? projectMedia : []).filter((m: any) => m.type === 'FLOOR_PLAN')

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
      // Validate payment plan percentage
      const totalPaymentPlanPercent = paymentPlan.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0)
      if (totalPaymentPlanPercent > 100) {
        throw new Error(`Total payment plan percentage cannot exceed 100% (currently ${totalPaymentPlanPercent}%)`)
      }

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
          paymentPlanName: selectedPaymentPlanName,
          handover: customHandover || undefined,
          visibleFields
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
      <div className="bg-white p-3 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-1 sm:gap-2">
          {[
            { s: 1, title: 'Customer', desc: 'Select or create' },
            { s: 2, title: 'Project', desc: 'Choose property' },
            { s: 3, title: 'Unit', desc: 'Select inventory' },
            { s: 4, title: 'Customize', desc: 'Price & payment' },
          ].map((item, idx) => {
            const isCompleted = step > item.s
            const isCurrent = step === item.s
            return (
              <div key={item.s} className="flex-1 flex items-center">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all shadow-sm shrink-0 ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-red-600 text-white ring-2 sm:ring-4 ring-red-100' :
                    'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : item.s}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className={`text-xs sm:text-sm font-semibold leading-none ${isCurrent ? 'text-neutral-900' : isCompleted ? 'text-green-700' : 'text-neutral-400'}`}>
                      {item.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-neutral-400 mt-1 font-normal">{item.desc}</p>
                  </div>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-3 transition-colors ${step > item.s ? 'bg-green-500' : 'bg-neutral-200'}`} />
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
          <CardHeader>
            <CardTitle className="text-xl">Select Unit</CardTitle>
            <CardDescription>Filter by unit specs or search by unit number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filter Bar */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Search Unit #</Label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                    <Input
                      placeholder="e.g. A101, 1008"
                      value={unitSearch}
                      onChange={e => setUnitSearch(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Type</Label>
                  <select
                    value={unitFilterType}
                    onChange={e => setUnitFilterType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">All Types</option>
                    <option value="APARTMENT">Apartment</option>
                    <option value="STUDIO">Studio</option>
                    <option value="VILLA">Villa</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="PENTHOUSE">Penthouse</option>
                    <option value="PLOT">Plot</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bedrooms</Label>
                  <select
                    value={unitFilterBeds}
                    onChange={e => setUnitFilterBeds(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">All Bedrooms</option>
                    <option value="0">Studio / 0 Bed</option>
                    <option value="1">1 Bed</option>
                    <option value="2">2 Bed</option>
                    <option value="3">3 Bed</option>
                    <option value="4">4+ Bed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Size Range (m²)</Label>
                  <div className="flex gap-1.5">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={unitMinSize}
                      onChange={e => setUnitMinSize(e.target.value)}
                      className="h-9 text-sm px-2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={unitMaxSize}
                      onChange={e => setUnitMaxSize(e.target.value)}
                      className="h-9 text-sm px-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold whitespace-nowrap">Price Range (USD):</Label>
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={unitMinPrice}
                    onChange={e => setUnitMinPrice(e.target.value)}
                    className="h-8 w-28 text-xs px-2"
                  />
                  <span className="text-neutral-400 text-xs">-</span>
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={unitMaxPrice}
                    onChange={e => setUnitMaxPrice(e.target.value)}
                    className="h-8 w-28 text-xs px-2"
                  />
                </div>

                {(unitSearch || unitFilterType || unitFilterBeds !== '' || unitMinSize || unitMaxSize || unitMinPrice || unitMaxPrice) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUnitSearch('')
                      setUnitFilterType('')
                      setUnitFilterBeds('')
                      setUnitMinSize('')
                      setUnitMaxSize('')
                      setUnitMinPrice('')
                      setUnitMaxPrice('')
                    }}
                    className="text-xs h-8 text-neutral-600 hover:text-red-600"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            {filteredUnits.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <p className="text-neutral-700 text-sm font-semibold">No available units matching your filter criteria.</p>
                <p className="text-neutral-400 text-xs">Try resetting or broadening your search filters above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {paginatedUnits.map((unit: any) => (
                    <button key={unit.id} type="button" onClick={() => {
                      setSelectedUnit(unit)
                      setSelectedPriceVal(Number(unit.price))
                      setSelectedPricingType('Base Price')
                      setUnitCondition(unit.deliveryForm || '')
                      setTowerBlock(unit.towerBlock || '')
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 bg-white sm:px-6 rounded-b-xl mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={unitPage === 1}
                        onClick={() => setUnitPage(prev => Math.max(prev - 1, 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={unitPage === totalPages}
                        onClick={() => setUnitPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-neutral-700">
                          Showing <span className="font-semibold">{Math.min(filteredUnits.length, (unitPage - 1) * UNITS_PER_PAGE + 1)}</span> to{' '}
                          <span className="font-semibold">{Math.min(filteredUnits.length, unitPage * UNITS_PER_PAGE)}</span> of{' '}
                          <span className="font-semibold">{filteredUnits.length}</span> units
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unitPage === 1}
                          onClick={() => setUnitPage(1)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          &laquo;
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unitPage === 1}
                          onClick={() => setUnitPage(prev => Math.max(prev - 1, 1))}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          &lsaquo;
                        </Button>
                        <span className="text-xs text-neutral-600 px-2 font-medium">
                          Page {unitPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unitPage === totalPages}
                          onClick={() => setUnitPage(prev => Math.min(prev + 1, totalPages))}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          &rsaquo;
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unitPage === totalPages}
                          onClick={() => setUnitPage(totalPages)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          &raquo;
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
      {step === 4 && selectedUnit && (() => {
        const pricingOptions = [
          { type: 'Base Price', label: `Base Price - ${Number(selectedUnit.price).toLocaleString()} USD`, price: Number(selectedUnit.price), defaultDelivery: selectedUnit.deliveryForm || 'Base Price' },
          ...(selectedUnit.blackFramePrice ? [{ type: 'Black Frame', label: `Black Frame - ${Number(selectedUnit.blackFramePrice).toLocaleString()} USD`, price: Number(selectedUnit.blackFramePrice), defaultDelivery: 'Black Frame' }] : []),
          ...(selectedUnit.whiteFramePrice ? [{ type: 'White Frame', label: `White Frame - ${Number(selectedUnit.whiteFramePrice).toLocaleString()} USD`, price: Number(selectedUnit.whiteFramePrice), defaultDelivery: 'White Frame' }] : []),
          ...(selectedUnit.greenFramePrice ? [{ type: 'Green Frame', label: `Green Frame - ${Number(selectedUnit.greenFramePrice).toLocaleString()} USD`, price: Number(selectedUnit.greenFramePrice), defaultDelivery: 'Green Frame' }] : []),
          ...(selectedUnit.turnkeyPrice ? [{ type: 'Turnkey', label: `Turnkey - ${Number(selectedUnit.turnkeyPrice).toLocaleString()} USD`, price: Number(selectedUnit.turnkeyPrice), defaultDelivery: 'Turnkey' }] : []),
        ]

        return (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="shadow-sm bg-neutral-50 border-neutral-200">
              <CardContent className="p-5">
                <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider mb-3">Proposal Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-neutral-500 text-xs">Customer</p><p className="font-semibold text-neutral-900">{selectedCustomer?.name || newCustomerForm.name}</p></div>
                  <div><p className="text-neutral-500 text-xs">Unit</p><p className="font-semibold text-neutral-900">{selectedUnit.unitNumber}</p></div>
                  <div><p className="text-neutral-500 text-xs">Selected Price</p><p className="font-semibold text-neutral-900">{selectedPriceVal.toLocaleString()} {selectedUnit.currency}</p></div>
                  <div><p className="text-neutral-500 text-xs">Size</p><p className="font-semibold text-neutral-900">{Number(selectedUnit.size).toLocaleString()} m²</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-neutral-200">
              <CardHeader><CardTitle className="text-xl">Customizations</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="font-semibold text-neutral-800">Pricing Type</Label>
                    <select
                      value={selectedPriceVal}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setSelectedPriceVal(val)
                        const opt = pricingOptions.find(o => o.price === val)
                        if (opt) {
                          setSelectedPricingType(opt.type)
                          setUnitCondition(opt.defaultDelivery)
                        }
                        if (discountPercent) {
                          const discounted = val * (1 - Number(discountPercent) / 100)
                          setCustomPrice(discounted.toFixed(0))
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
                    <Label className="font-semibold text-neutral-800">Custom Price (USD)</Label>
                    <Input
                      type="number"
                      placeholder={String(selectedPriceVal)}
                      value={customPrice}
                      onChange={e => {
                        const cPrice = e.target.value
                        setCustomPrice(cPrice)
                        if (cPrice && selectedPriceVal > 0) {
                          const disc = ((selectedPriceVal - Number(cPrice)) / selectedPriceVal) * 100
                          setDiscountPercent(disc > 0 ? disc.toFixed(1) : '0')
                        } else {
                          setDiscountPercent('')
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-neutral-800">Discount (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="0"
                      value={discountPercent}
                      onChange={e => {
                        const pct = e.target.value
                        setDiscountPercent(pct)
                        if (pct && selectedPriceVal > 0) {
                          const discounted = selectedPriceVal * (1 - Number(pct) / 100)
                          setCustomPrice(discounted.toFixed(0))
                        } else {
                          setCustomPrice('')
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="font-semibold text-neutral-800">Tower/Block</Label><Input placeholder="e.g. Tower A" value={towerBlock} onChange={e => setTowerBlock(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="font-semibold text-neutral-800">Delivery Form</Label><Input placeholder="e.g. White Frame, Turnkey" value={unitCondition} onChange={e => setUnitCondition(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="font-semibold text-neutral-800">Handover Date (Overrides Project/Unit)</Label><Input type="date" value={customHandover} onChange={e => setCustomHandover(e.target.value)} /></div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <Label className="font-semibold text-neutral-800">Display Fields in Proposal</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleFields.includes('building')}
                        onChange={e => {
                          if (e.target.checked) setVisibleFields([...visibleFields, 'building'])
                          else setVisibleFields(visibleFields.filter(f => f !== 'building'))
                        }}
                        className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                      />
                      Show Building
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleFields.includes('renovationPrice')}
                        onChange={e => {
                          if (e.target.checked) setVisibleFields([...visibleFields, 'renovationPrice'])
                          else setVisibleFields(visibleFields.filter(f => f !== 'renovationPrice'))
                        }}
                        className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                      />
                      Show Renovation Price
                    </label>
                  </div>
                </div>
              <div className="space-y-1"><Label>Message to Customer</Label><textarea value={customerMessage} onChange={e => setCustomerMessage(e.target.value)} rows={3} placeholder="Dear [customer name], it is our pleasure to present this exclusive offer..." className="flex w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Internal Notes</Label><Input placeholder="Private notes (not shown in PDF)..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Floor Plan Image</Label>
                  <div className="flex gap-2">
                    <Input placeholder="URL or upload..." value={customFloorPlanUrl} onChange={e => setCustomFloorPlanUrl(e.target.value)} className="flex-1 text-xs" />
                    <input type="file" id="custom-floor-upload" className="hidden" accept="image/*" onChange={handleFloorPlanUpload} />
                    <label htmlFor="custom-floor-upload" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-xs">
                      {floorPlanUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                  {projectFloorPlans.length > 0 && (
                    <select
                      value={customFloorPlanUrl}
                      onChange={e => setCustomFloorPlanUrl(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 mt-1.5"
                    >
                      <option value="">Or select project floor plan...</option>
                      {projectFloorPlans.map((fp: any) => (
                        <option key={fp.id} value={fp.url}>{fp.name || fp.url.split('/').pop()}</option>
                      ))}
                    </select>
                  )}
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
                            const subSum = p.subMilestones.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0)
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
                          <td className={`px-3 py-2 text-center font-bold ${paymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                            {paymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0)}%
                          </td>
                          <td colSpan={4} className="px-3 py-2 text-right">
                            {paymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) > 100 && (
                              <span className="text-red-600 font-semibold">⚠️ Cannot exceed 100%</span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold text-neutral-800">Select Images for PDF ({selectedImages.length} selected)</Label>
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
                  <Label className="font-semibold text-neutral-800">Proposal Template (Optional)</Label>
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
            <Button onClick={() => createProposalMutation.mutate()} disabled={createProposalMutation.isPending || paymentPlan.reduce((a, p) => a + (Number(p.percentage) || 0), 0) > 100} className="bg-red-600 hover:bg-red-700 text-white px-6">
              {createProposalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Create Proposal
            </Button>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
