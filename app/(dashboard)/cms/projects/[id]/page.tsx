'use client'

import { useState, useEffect, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Calendar, Globe, Loader2, Plus, Trash2, Upload, X, CheckSquare, Square, Download, Eye, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { usePermissions } from '@/hooks/usePermissions'
import { useFileUpload } from '@/hooks/useFileUpload'
import { FileUploadProgressModal } from '@/components/cms/FileUploadProgressModal'

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
  const { progressInfo, uploadFiles, cancelUpload, resetProgress } = useFileUpload()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [mediaType, setMediaType] = useState('IMAGE')
  const [uploading, setUploading] = useState(false)
  const [unitFloorPlanUploading, setUnitFloorPlanUploading] = useState(false)
  const [unitFloorPlanUploading2, setUnitFloorPlanUploading2] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [planUnitId, setPlanUnitId] = useState<number | null>(null)
  const [planSchedule, setPlanSchedule] = useState<{milestone: string, percentage: string, date: string}[]>([])
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([])
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([])
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkFile, setBulkFile] = useState<File | null>(null)
  const [bulkHeaders, setBulkHeaders] = useState<string[]>([])
  const [bulkRows, setBulkRows] = useState<any[]>([])
  const [bulkMapping, setBulkMapping] = useState<Record<string, string>>({})
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkTurnkeyCalcMethod, setBulkTurnkeyCalcMethod] = useState('TOTAL_AREA')

  // Bulk floor plan states
  const [showBulkFloorPlan, setShowBulkFloorPlan] = useState(false)
  const [bulkFloorPlanUrl, setBulkFloorPlanUrl] = useState('')
  const [bulkFloorPlanBeds, setBulkFloorPlanBeds] = useState('')
  const [bulkFloorPlanType, setBulkFloorPlanType] = useState('')
  const [bulkFloorPlanUploading, setBulkFloorPlanUploading] = useState(false)
  const [bulkFloorPlanSubmitting, setBulkFloorPlanSubmitting] = useState(false)

  // Unit filter states
  const [unitFilterSearch, setUnitFilterSearch] = useState('')
  const [unitFilterBuilding, setUnitFilterBuilding] = useState('')
  const [unitFilterTower, setUnitFilterTower] = useState('')
  const [unitFilterFloor, setUnitFilterFloor] = useState('')
  const [unitFilterBeds, setUnitFilterBeds] = useState('')
  const [unitFilterMinSize, setUnitFilterMinSize] = useState('')
  const [unitFilterMaxSize, setUnitFilterMaxSize] = useState('')
  const [unitFilterMinPrice, setUnitFilterMinPrice] = useState('')
  const [unitFilterMaxPrice, setUnitFilterMaxPrice] = useState('')

  // Pagination State
  const [unitPage, setUnitPage] = useState(1)

  // -- Queries --
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}`)
      if (!res.ok) throw new Error('Failed to load project')
      return res.json()
    }
  })

  const { data: rawUnits } = useQuery({
    queryKey: ['units', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}/units`)
      if (!res.ok) throw new Error('Failed to load units')
      return res.json()
    }
  })

  const { data: rawAllAmenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      const res = await fetch('/api/cms/amenities')
      if (!res.ok) throw new Error('Failed to load amenities')
      return res.json()
    }
  })

  const { data: rawProjectAmenities } = useQuery({
    queryKey: ['project-amenities', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}/amenities`)
      if (!res.ok) throw new Error('Failed to load project amenities')
      return res.json()
    }
  })

  const { data: rawPaymentPlans } = useQuery({
    queryKey: ['payment-plans', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}/payment-plans`)
      if (!res.ok) throw new Error('Failed to load payment plans')
      return res.json()
    }
  })

  const { data: rawMediaFiles } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      const res = await fetch(`/api/cms/projects/${id}/media`)
      if (!res.ok) throw new Error('Failed to load media files')
      return res.json()
    }
  })

  const units = Array.isArray(rawUnits) ? rawUnits : []
  const allAmenities = Array.isArray(rawAllAmenities) ? rawAllAmenities : []
  const projectAmenities = Array.isArray(rawProjectAmenities) ? rawProjectAmenities : []
  const paymentPlans = Array.isArray(rawPaymentPlans) ? rawPaymentPlans : []
  const mediaFiles = Array.isArray(rawMediaFiles) ? rawMediaFiles : []
  const projectFloorPlans = mediaFiles.filter((m: any) => m.type === 'FLOOR_PLAN')

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

  const bulkDeleteUnitsMutation = useMutation({
    mutationFn: async (unitIds: number[]) => {
      const res = await fetch(`/api/cms/units/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unitIds })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete units')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', id] })
      setSelectedUnitIds([])
      toast.success('Selected units deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete units')
    }
  })

  const handleExportUnits = () => {
    const unitsToExport = selectedUnitIds.length > 0
      ? units.filter((u: any) => selectedUnitIds.includes(u.id))
      : units

    if (unitsToExport.length === 0) {
      toast.error('No units to export')
      return
    }

    const headers = [
      'Unit Number',
      'Tower Block',
      'Building',
      'Type',
      'Status',
      'View',
      'Handover',
      'Bedrooms',
      'Bathrooms',
      'Floor',
      'Size (sqm)',
      'Price Per Sqm (USD)',
      'Total Price (USD)',
      'Living Area (sqm)',
      'Balcony (sqm)',
      'Terrace (sqm)',
      'Greenyard (sqm)',
      'Delivery Form',
      'Black Frame',
      'Black Frame Price',
      'White Frame',
      'White Frame Price',
      'Green Frame',
      'Green Frame Price',
      'Renovation Option',
      'Renovation Price',
      'Renovation Price Per Sqm',
      'Floor Plan URL 1',
      'Floor Plan URL 2'
    ]

    const csvRows = [headers.join(',')]

    for (const unit of unitsToExport) {
      const row = [
        unit.unitNumber || '',
        unit.towerBlock || '',
        unit.building || '',
        unit.type || '',
        unit.status || '',
        unit.view || '',
        unit.handover ? new Date(unit.handover).toISOString().split('T')[0] : '',
        unit.bedrooms ?? '',
        unit.bathrooms ?? '',
        unit.floor ?? '',
        unit.size ?? '',
        unit.priceSqm ?? '',
        unit.price ?? '',
        unit.livingAreaSize ?? '',
        unit.balconySize ?? '',
        unit.terraceSize ?? '',
        unit.greenyardSize ?? '',
        unit.deliveryForm || '',
        unit.blackFrame ? 'Yes' : 'No',
        unit.blackFramePrice ?? '',
        unit.whiteFrame ? 'Yes' : 'No',
        unit.whiteFramePrice ?? '',
        unit.greenFrame ? 'Yes' : 'No',
        unit.greenFramePrice ?? '',
        unit.renovationOption ? 'Yes' : 'No',
        unit.renovationPrice ?? '',
        unit.renovationPriceSqm ?? '',
        unit.floorPlanUrl || '',
        unit.floorPlanUrl2 || ''
      ]

      const escapedRow = row.map(val => {
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })

      csvRows.push(escapedRow.join(','))
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'))
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    const projectNameClean = (project?.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const fileSuffix = selectedUnitIds.length > 0 ? `selected_${selectedUnitIds.length}_units` : 'all_units'
    link.setAttribute('download', `${projectNameClean}_${fileSuffix}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${selectedUnitIds.length > 0 ? 'Selected' : 'All'} units exported successfully`)
  }

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
      setEditingPlanId(null)
      toast.success('Payment plan added')
    }
  })

  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cms/payment-plans/${editingPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: planName, 
          description: planDesc, 
          unitId: planUnitId || null,
          schedule: planSchedule.map(s => ({
            milestone: s.milestone,
            percentage: Number(s.percentage),
            date: s.date
          }))
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans', id] })
      setPlanName('')
      setPlanDesc('')
      setPlanUnitId(null)
      setPlanSchedule([])
      setEditingPlanId(null)
      setShowAddPlan(false)
      toast.success('Payment plan updated')
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

  const renameMediaMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await fetch(`/api/cms/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error('Failed to rename file')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', id] })
      toast.success('File renamed')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to rename file')
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
  const [expandedViewUnitId, setExpandedViewUnitId] = useState<number | null>(null)
  const [expandedEditUnitId, setExpandedEditUnitId] = useState<number | null>(null)

  const { register: regUnit, handleSubmit: handleUnit, reset: resetUnit, setValue: setUnitValue, watch: watchUnit } = useForm()

  const watchedPriceSqm = watchUnit('priceSqm')
  const watchedSize = watchUnit('size')
  const watchedLivingAreaSize = watchUnit('livingAreaSize')
  const watchedTurnkeyCalcMethod = watchUnit('turnkeyCalcMethod') || 'TOTAL_AREA'
  const watchedWhiteFramePriceSqm = watchUnit('whiteFramePriceSqm')
  const watchedGreenFramePriceSqm = watchUnit('greenFramePriceSqm')
  const watchedBlackFramePriceSqm = watchUnit('blackFramePriceSqm')
  const watchedRenovationPriceSqm = watchUnit('renovationPriceSqm')

  useEffect(() => {
    const sz = Number(watchedSize)
    const lsz = Number(watchedLivingAreaSize)
    
    // Turnkey Price
    if (watchedPriceSqm !== undefined && watchedPriceSqm !== '') {
      const pSqm = Number(watchedPriceSqm)
      if (!isNaN(pSqm)) {
        const area = watchedTurnkeyCalcMethod === 'LIVING_AREA' ? lsz : sz
        if (!isNaN(area) && area > 0) {
          setUnitValue('turnkeyPrice', (pSqm * area).toFixed(2))
        }
      }
    }

    // White Frame Price
    if (watchedWhiteFramePriceSqm !== undefined && watchedWhiteFramePriceSqm !== '' && !isNaN(sz) && sz > 0) {
      const pSqm = Number(watchedWhiteFramePriceSqm)
      if (!isNaN(pSqm)) {
        setUnitValue('whiteFramePrice', (pSqm * sz).toFixed(2))
      }
    }

    // Green Frame Price
    if (watchedGreenFramePriceSqm !== undefined && watchedGreenFramePriceSqm !== '' && !isNaN(sz) && sz > 0) {
      const pSqm = Number(watchedGreenFramePriceSqm)
      if (!isNaN(pSqm)) {
        setUnitValue('greenFramePrice', (pSqm * sz).toFixed(2))
      }
    }

    // Black Frame Price
    if (watchedBlackFramePriceSqm !== undefined && watchedBlackFramePriceSqm !== '' && !isNaN(sz) && sz > 0) {
      const pSqm = Number(watchedBlackFramePriceSqm)
      if (!isNaN(pSqm)) {
        setUnitValue('blackFramePrice', (pSqm * sz).toFixed(2))
      }
    }

    // Renovation Price
    if (watchedRenovationPriceSqm !== undefined && watchedRenovationPriceSqm !== '' && !isNaN(sz) && sz > 0) {
      const pSqm = Number(watchedRenovationPriceSqm)
      if (!isNaN(pSqm)) {
        setUnitValue('renovationPrice', (pSqm * sz).toFixed(2))
      }
    }
  }, [
    watchedPriceSqm,
    watchedSize,
    watchedLivingAreaSize,
    watchedTurnkeyCalcMethod,
    watchedWhiteFramePriceSqm,
    watchedGreenFramePriceSqm,
    watchedBlackFramePriceSqm,
    watchedRenovationPriceSqm,
    setUnitValue
  ])

  useEffect(() => {
    setUnitPage(1)
  }, [
    unitFilterSearch,
    unitFilterBuilding,
    unitFilterTower,
    unitFilterFloor,
    unitFilterBeds,
    unitFilterMinSize,
    unitFilterMaxSize,
    unitFilterMinPrice,
    unitFilterMaxPrice
  ])

  const createUnitMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        projectId: Number(id),
        bedrooms: data.bedrooms !== undefined && data.bedrooms !== '' ? Number(data.bedrooms) : undefined,
        bathrooms: data.bathrooms !== undefined && data.bathrooms !== '' ? Number(data.bathrooms) : undefined,
        size: data.size !== undefined && data.size !== '' ? Number(data.size) : undefined,
        price: data.price !== undefined && data.price !== '' ? Number(data.price) : undefined,
        priceSqm: data.priceSqm !== undefined && data.priceSqm !== '' ? Number(data.priceSqm) : undefined,
        towerBlock: data.towerBlock || undefined,
        floor: data.floor !== undefined && data.floor !== '' ? Number(data.floor) : undefined,
        livingAreaSize: data.livingAreaSize ? Number(data.livingAreaSize) : undefined,
        balconySize: data.balconySize ? Number(data.balconySize) : undefined,
        terraceSize: data.terraceSize ? Number(data.terraceSize) : undefined,
        greenyardSize: data.greenyardSize ? Number(data.greenyardSize) : undefined,
        deliveryForm: data.deliveryForm || undefined,
        blackFrame: data.blackFrame === true || data.blackFrame === 'true',
        whiteFrame: data.whiteFrame === true || data.whiteFrame === 'true',
        greenFrame: data.greenFrame === true || data.greenFrame === 'true',
        turnkey: data.turnkey === true || data.turnkey === 'true',
        blackFramePrice: data.blackFramePrice ? Number(data.blackFramePrice) : undefined,
        whiteFramePrice: data.whiteFramePrice ? Number(data.whiteFramePrice) : undefined,
        greenFramePrice: data.greenFramePrice ? Number(data.greenFramePrice) : undefined,
        turnkeyPrice: data.turnkeyPrice ? Number(data.turnkeyPrice) : undefined,
        greenFramePriceSqm: data.greenFramePriceSqm ? Number(data.greenFramePriceSqm) : undefined,
        whiteFramePriceSqm: data.whiteFramePriceSqm ? Number(data.whiteFramePriceSqm) : undefined,
        blackFramePriceSqm: data.blackFramePriceSqm ? Number(data.blackFramePriceSqm) : undefined,
        renovationPriceSqm: data.renovationPriceSqm ? Number(data.renovationPriceSqm) : undefined,
        renovationPrice: data.renovationPrice ? Number(data.renovationPrice) : undefined,
        handover: data.handover ? new Date(data.handover).toISOString() : undefined,
        building: data.building || undefined,
        turnkeyCalcMethod: data.turnkeyCalcMethod || 'TOTAL_AREA',
        status: data.status || 'AVAILABLE'
      }
      
      const res = await fetch(editingUnit ? `/api/cms/units/${editingUnit.id}` : '/api/cms/units', {
        method: editingUnit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save unit')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', id] })
      resetUnit()
      setShowAddUnit(false)
      setEditingUnit(null)
      setExpandedEditUnitId(null)
      toast.success(editingUnit ? 'Unit updated' : 'Unit added')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save unit')
    }
  })

  const openEditUnit = (unit: any) => {
    setEditingUnit(unit)
    setExpandedEditUnitId(unit.id)
    setExpandedViewUnitId(null)
    resetUnit({
      unitNumber: unit.unitNumber || '',
      towerBlock: unit.towerBlock || '',
      type: unit.type || 'APARTMENT',
      status: unit.status || 'AVAILABLE',
      view: unit.view || '',
      bedrooms: unit.bedrooms ?? '',
      bathrooms: unit.bathrooms ?? '',
      floor: unit.floor ?? '',
      size: unit.size ?? '',
      priceSqm: unit.priceSqm ?? '',
      price: unit.price ?? '',
      floorPlanUrl: unit.floorPlanUrl || '',
      floorPlanUrl2: unit.floorPlanUrl2 || '',
      livingAreaSize: unit.livingAreaSize || '',
      balconySize: unit.balconySize || '',
      terraceSize: unit.terraceSize || '',
      greenyardSize: unit.greenyardSize || '',
      deliveryForm: unit.deliveryForm || '',
      blackFrame: unit.blackFrame || false,
      whiteFrame: unit.whiteFrame || false,
      greenFrame: unit.greenFrame || false,
      turnkey: unit.turnkey || false,
      blackFramePrice: unit.blackFramePrice || '',
      whiteFramePrice: unit.whiteFramePrice || '',
      greenFramePrice: unit.greenFramePrice || '',
      turnkeyPrice: unit.turnkeyPrice || '',
      greenFramePriceSqm: unit.greenFramePriceSqm || '',
      whiteFramePriceSqm: unit.whiteFramePriceSqm || '',
      blackFramePriceSqm: unit.blackFramePriceSqm || '',
      renovationPriceSqm: unit.renovationPriceSqm || '',
      renovationPrice: unit.renovationPrice || '',
      handover: unit.handover ? new Date(unit.handover).toISOString().split('T')[0] : '',
      building: unit.building || '',
      turnkeyCalcMethod: unit.turnkeyCalcMethod || 'TOTAL_AREA'
    })
  }

  const handleUnitFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    setUnitFloorPlanUploading(true)
    try {
      await uploadFiles(fileList, {
        type: 'FLOOR_PLAN',
        projectId: id as string,
        onSingleSuccess: (file, responseData) => {
          if (responseData && responseData.url) {
            setUnitValue('floorPlanUrl', responseData.url)
            toast.success('Floor plan uploaded')
          }
        }
      })
    } catch (err: any) {
      toast.error('Failed to upload floor plan')
    } finally {
      setUnitFloorPlanUploading(false)
      e.target.value = ''
    }
  }

  const handleUnitFloorPlanUpload2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    setUnitFloorPlanUploading2(true)
    try {
      await uploadFiles(fileList, {
        type: 'FLOOR_PLAN',
        projectId: id as string,
        onSingleSuccess: (file, responseData) => {
          if (responseData && responseData.url) {
            setUnitValue('floorPlanUrl2', responseData.url)
            toast.success('Second floor plan uploaded')
          }
        }
      })
    } catch (err: any) {
      toast.error('Failed to upload second floor plan')
    } finally {
      setUnitFloorPlanUploading2(false)
      e.target.value = ''
    }
  }

  // -- File Upload --
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileList = Array.from(files)
    setUploading(true)
    try {
      const result = await uploadFiles(fileList, {
        type: mediaType,
        projectId: id as string,
        onSingleSuccess: async (file, responseData) => {
          if (responseData && responseData.url) {
            await fetch(`/api/cms/projects/${id}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: mediaType,
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
        queryClient.invalidateQueries({ queryKey: ['media', id] })
        toast.success(`${result.successful} file(s) uploaded successfully`)
      }
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
      <div className="border-b border-neutral-200 overflow-x-auto custom-scrollbar">
        <nav className="flex space-x-0 -mb-px whitespace-nowrap min-w-max">
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
      {activeTab === 'units' && (() => {
        const projectFloorPlans = mediaFiles.filter((m: any) => m.type === 'FLOOR_PLAN')

        const filteredUnits = units.filter((unit: any) => {
          if (unitFilterSearch && !(unit?.unitNumber || '').toLowerCase().includes(unitFilterSearch.toLowerCase())) return false
          if (unitFilterBuilding && !(unit?.building || '').toLowerCase().includes(unitFilterBuilding.toLowerCase())) return false
          if (unitFilterTower && !(unit?.towerBlock || '').toLowerCase().includes(unitFilterTower.toLowerCase())) return false
          if (unitFilterFloor && String(unit?.floor ?? '') !== unitFilterFloor) return false
          if (unitFilterBeds && String(unit?.bedrooms ?? '') !== unitFilterBeds) return false
          if (unitFilterMinSize && Number(unit?.size || 0) < Number(unitFilterMinSize)) return false
          if (unitFilterMaxSize && Number(unit?.size || 0) > Number(unitFilterMaxSize)) return false
          if (unitFilterMinPrice && Number(unit?.price || 0) < Number(unitFilterMinPrice)) return false
          if (unitFilterMaxPrice && Number(unit?.price || 0) > Number(unitFilterMaxPrice)) return false
          return true
        })

        const UNITS_PER_PAGE = 25
        const totalPages = Math.ceil(filteredUnits.length / UNITS_PER_PAGE)
        const paginatedUnits = filteredUnits.slice((unitPage - 1) * UNITS_PER_PAGE, unitPage * UNITS_PER_PAGE)

        return (
          <div className="space-y-4">
            {/* Filter Bar */}
            <Card className="shadow-sm border-neutral-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Filter &amp; Search Units</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Unit #</Label>
                  <Input placeholder="Search..." value={unitFilterSearch} onChange={e => setUnitFilterSearch(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Building</Label>
                  <Input placeholder="Search Building..." value={unitFilterBuilding} onChange={e => setUnitFilterBuilding(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tower/Block</Label>
                  <Input placeholder="Search Tower/Block..." value={unitFilterTower} onChange={e => setUnitFilterTower(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Floor</Label>
                  <Input type="number" min={0} placeholder="Floor" value={unitFilterFloor} onChange={e => setUnitFilterFloor(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Beds</Label>
                  <select value={unitFilterBeds} onChange={e => setUnitFilterBeds(e.target.value)} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                    <option value="">Any</option>
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Bed</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Size (m²)</Label>
                  <Input type="number" placeholder="Min" value={unitFilterMinSize} onChange={e => setUnitFilterMinSize(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Size (m²)</Label>
                  <Input type="number" placeholder="Max" value={unitFilterMaxSize} onChange={e => setUnitFilterMaxSize(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Price (USD)</Label>
                  <Input type="number" placeholder="Min" value={unitFilterMinPrice} onChange={e => setUnitFilterMinPrice(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Price (USD)</Label>
                  <Input type="number" placeholder="Max" value={unitFilterMaxPrice} onChange={e => setUnitFilterMaxPrice(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" className="w-full text-xs" onClick={() => {
                    setUnitFilterSearch('')
                    setUnitFilterBuilding('')
                    setUnitFilterTower('')
                    setUnitFilterFloor('')
                    setUnitFilterBeds('')
                    setUnitFilterMinSize('')
                    setUnitFilterMaxSize('')
                    setUnitFilterMinPrice('')
                    setUnitFilterMaxPrice('')
                  }}>Reset Filters</Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                {canEdit && selectedUnitIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${selectedUnitIds.length} selected unit(s)?`)) {
                        bulkDeleteUnitsMutation.mutate(selectedUnitIds)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedUnitIds.length})
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button onClick={handleExportUnits} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800">
                  <Download className="w-4 h-4 mr-2" /> {selectedUnitIds.length > 0 ? `Export Selected (${selectedUnitIds.length})` : 'Export All Units (CSV)'}
                </Button>
                {canEdit && (
                  <>
                    <Button onClick={() => setShowBulkFloorPlan(true)} variant="outline">
                      <Building2 className="w-4 h-4 mr-2" /> Assign Floor Plan
                    </Button>
                    <Button onClick={() => setShowBulkUpload(true)} variant="outline">
                      <Upload className="w-4 h-4 mr-2" /> Bulk Upload Units
                    </Button>
                    <Button onClick={() => { setEditingUnit(null); resetUnit(); setShowAddUnit(!showAddUnit) }} className="bg-red-600 hover:bg-red-700">
                      <Plus className="w-4 h-4 mr-2" /> Add Unit
                    </Button>
                  </>
                )}
              </div>
            </div>

            {showAddUnit && !editingUnit && canEdit && (
              <Card className="shadow-sm border-red-100 mb-4">
                <CardHeader><CardTitle className="text-lg">New Unit</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleUnit((data) => createUnitMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                      <div className="space-y-1"><Label>Unit Number</Label><Input placeholder="A-101" {...regUnit('unitNumber')} /></div>
                      <div className="space-y-1"><Label>Tower/Block</Label><Input placeholder="e.g. Tower A" {...regUnit('towerBlock')} /></div>
                      <div className="space-y-1"><Label>Building</Label><Input placeholder="e.g. Building 1" {...regUnit('building')} /></div>
                      <div className="space-y-1"><Label>Type</Label>
                        <select {...regUnit('type')} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
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
                      <div className="space-y-1"><Label>Handover</Label><Input type="date" {...regUnit('handover')} /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="space-y-1"><Label>Bedrooms</Label><Input type="number" min={0} {...regUnit('bedrooms')} /></div>
                      <div className="space-y-1"><Label>Bathrooms</Label><Input type="number" min={0} {...regUnit('bathrooms')} /></div>
                      <div className="space-y-1"><Label>Floor</Label><Input type="number" min={0} {...regUnit('floor')} /></div>
                      <div className="space-y-1"><Label>Size (m²)</Label><Input type="number" step="0.01" {...regUnit('size')} /></div>
                      <div className="space-y-1"><Label>Turnkey Price / m² (USD)</Label><Input type="number" step="0.01" placeholder="e.g. 1000" {...regUnit('priceSqm')} /></div>
                      <div className="space-y-1"><Label>Total Price (USD)</Label><Input type="number" step="0.01" {...regUnit('price')} /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-1"><Label>Living Area (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 85.5" {...regUnit('livingAreaSize')} /></div>
                      <div className="space-y-1"><Label>Balcony (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 10.2" {...regUnit('balconySize')} /></div>
                      <div className="space-y-1"><Label>Terrace (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 15.0" {...regUnit('terraceSize')} /></div>
                      <div className="space-y-1"><Label>Greenyard (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 25.4" {...regUnit('greenyardSize')} /></div>
                      <div className="space-y-1"><Label>Delivery Form</Label><Input placeholder="e.g. Turnkey" {...regUnit('deliveryForm')} /></div>
                    </div>

                    <div className="border border-neutral-100 p-3 rounded-lg bg-neutral-50/50 space-y-3">
                      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Frames Options &amp; Pricing</Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="unit-blackFrame" {...regUnit('blackFrame')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                          <label htmlFor="unit-blackFrame" className="text-sm font-medium text-neutral-700 select-none cursor-pointer">Black Frame</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="unit-whiteFrame" {...regUnit('whiteFrame')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                          <label htmlFor="unit-whiteFrame" className="text-sm font-medium text-neutral-700 select-none cursor-pointer">White Frame</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="unit-greenFrame" {...regUnit('greenFrame')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                          <label htmlFor="unit-greenFrame" className="text-sm font-medium text-neutral-700 select-none cursor-pointer">Green Frame</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="unit-turnkey" {...regUnit('turnkey')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                          <label htmlFor="unit-turnkey" className="text-sm font-medium text-neutral-700 select-none cursor-pointer">Turnkey</label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Black Frame / sqm (USD)</Label>
                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('blackFramePriceSqm')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">White Frame / sqm (USD)</Label>
                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('whiteFramePriceSqm')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Green Frame / sqm (USD)</Label>
                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('greenFramePriceSqm')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Renovation / sqm (USD)</Label>
                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('renovationPriceSqm')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Turnkey Price Option</Label>
                          <select {...regUnit('turnkeyCalcMethod')} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                            <option value="TOTAL_AREA">Total Area × Turnkey Price / sqm</option>
                            <option value="LIVING_AREA">Living Area × Turnkey Price / sqm</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Black Frame Price Total</Label>
                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('blackFramePrice')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">White Frame Price Total</Label>
                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('whiteFramePrice')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Green Frame Price Total</Label>
                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('greenFramePrice')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Renovation Price Total</Label>
                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('renovationPrice')} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Turnkey Price Total</Label>
                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('turnkeyPrice')} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Floor Plan URL 1</Label>
                        <div className="flex gap-2">
                          <Input placeholder="https://..." {...regUnit('floorPlanUrl')} className="flex-1 text-xs" />
                          <input type="file" id="unit-floor-upload" className="hidden" accept="image/*" onChange={handleUnitFloorPlanUpload} />
                          <label htmlFor="unit-floor-upload" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-xs">
                            {unitFloorPlanUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          </label>
                        </div>
                        {projectFloorPlans.length > 0 && (
                          <select
                            onChange={e => setUnitValue('floorPlanUrl', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 mt-1.5"
                          >
                            <option value="">Or select project floor plan...</option>
                            {projectFloorPlans.map((fp: any) => (
                              <option key={fp.id} value={fp.url}>{fp.name || fp.url.split('/').pop()}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Floor Plan URL 2</Label>
                        <div className="flex gap-2">
                          <Input placeholder="https://..." {...regUnit('floorPlanUrl2')} className="flex-1 text-xs" />
                          <input type="file" id="unit-floor-upload-2" className="hidden" accept="image/*" onChange={handleUnitFloorPlanUpload2} />
                          <label htmlFor="unit-floor-upload-2" className="flex h-9 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600 text-xs">
                            {unitFloorPlanUploading2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          </label>
                        </div>
                        {projectFloorPlans.length > 0 && (
                          <select
                            onChange={e => setUnitValue('floorPlanUrl2', e.target.value)}
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
                    <div className="flex gap-3">
                      <Button type="submit" disabled={createUnitMutation.isPending} className="bg-red-600 hover:bg-red-700">
                        {createUnitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Unit
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setShowAddUnit(false); setEditingUnit(null); resetUnit() }}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-sm">
              <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                {filteredUnits.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">No units match these filters.</div>
                ) : (
                  <div className="w-full">
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3 p-3 bg-neutral-50/50">
                      {paginatedUnits.map((unit: any) => (
                        <Card key={unit.id} className="border border-neutral-100 shadow-sm rounded-xl overflow-hidden bg-white">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-neutral-900 text-sm">Unit #{unit.unitNumber || '—'}</span>
                                {unit.towerBlock && <span className="text-[10px] text-neutral-400 ml-1.5">({unit.towerBlock})</span>}
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${UNIT_STATUS_COLORS[unit.status]}`}>{unit.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                              <div><span className="text-neutral-400 font-medium">Type:</span> <span className="text-neutral-700 font-semibold">{UNIT_TYPE_LABELS[unit.type] || unit.type?.toLowerCase()}</span></div>
                              <div><span className="text-neutral-400 font-medium">Floor:</span> <span className="text-neutral-700 font-semibold">{unit.floor ?? '—'}</span></div>
                              <div><span className="text-neutral-400 font-medium">Beds/Baths:</span> <span className="text-neutral-700 font-semibold">{unit.bedrooms ?? '—'} / {unit.bathrooms ?? '—'}</span></div>
                              <div><span className="text-neutral-400 font-medium">Size:</span> <span className="text-neutral-700 font-semibold">{unit.size ? `${Number(unit.size).toLocaleString()} m²` : '—'}</span></div>
                              <div><span className="text-neutral-400 font-medium">Price/m²:</span> <span className="text-neutral-700 font-semibold">{unit.priceSqm ? `$${Number(unit.priceSqm).toLocaleString()}` : '—'}</span></div>
                              <div><span className="text-neutral-400 font-medium">Total Price:</span> <span className="text-neutral-900 font-bold">{unit.price ? `$${Number(unit.price).toLocaleString()}` : '—'}</span></div>
                            </div>
                            {unit.floorPlanUrl && (
                              <div className="pt-0.5">
                                <a href={unit.floorPlanUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 hover:underline">
                                  View Floor Plan →
                                </a>
                              </div>
                            )}
                          </CardContent>
                          <div className="bg-neutral-50 px-4 py-2 border-t border-neutral-100 flex justify-between items-center gap-2">
                            <div className="flex gap-2">
                              {canEdit && (
                                <input
                                  type="checkbox"
                                  checked={selectedUnitIds.includes(unit.id)}
                                  onChange={() => {
                                    setSelectedUnitIds(prev => prev.includes(unit.id) ? prev.filter(i => i !== unit.id) : [...prev, unit.id])
                                  }}
                                  className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4 my-auto cursor-pointer"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-neutral-500 hover:text-blue-600"
                                onClick={() => {
                                  if (expandedViewUnitId === unit.id) setExpandedViewUnitId(null)
                                  else {
                                    setExpandedViewUnitId(unit.id)
                                    setExpandedEditUnitId(null)
                                  }
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              {canEdit ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs px-2 text-neutral-500 hover:text-blue-600"
                                    onClick={() => {
                                      if (expandedEditUnitId === unit.id) {
                                        setExpandedEditUnitId(null)
                                        setEditingUnit(null)
                                        resetUnit()
                                      } else {
                                        openEditUnit(unit)
                                      }
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs px-1 text-neutral-400 hover:text-red-600" onClick={() => {
                                     if (confirm(`Are you sure you want to delete unit ${unit.unitNumber || 'this unit'}?`)) {
                                       deleteUnitMutation.mutate(unit.id)
                                     }
                                   }}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-neutral-400 text-xs">Read-only</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded Mobile Details Panel */}
                          {expandedViewUnitId === unit.id && (
                            <div className="bg-neutral-50 p-4 border-t border-neutral-100 text-xs space-y-3">
                              <h4 className="font-bold text-neutral-800 border-b pb-1">Detailed Info</h4>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div><span className="text-neutral-400">Building:</span> <span className="font-semibold text-neutral-800">{unit.building || '—'}</span></div>
                                <div><span className="text-neutral-400">View:</span> <span className="font-semibold text-neutral-800">{unit.view || '—'}</span></div>
                                <div><span className="text-neutral-400">Delivery Form:</span> <span className="font-semibold text-neutral-800">{unit.deliveryForm || '—'}</span></div>
                                <div><span className="text-neutral-400">Handover:</span> <span className="font-semibold text-neutral-800">{unit.handover ? new Date(unit.handover).toLocaleDateString() : '—'}</span></div>
                              </div>
                              <div className="border-t border-neutral-200/60 pt-2 space-y-2">
                                <p className="font-semibold text-neutral-700 text-[11px]">Detailed Pricing</p>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div><span className="text-neutral-400">Black Frame:</span> <span className="font-semibold">${Number(unit.blackFramePrice || 0).toLocaleString()}</span></div>
                                  <div><span className="text-neutral-400">White Frame:</span> <span className="font-semibold">${Number(unit.whiteFramePrice || 0).toLocaleString()}</span></div>
                                  <div><span className="text-neutral-400">Green Frame:</span> <span className="font-semibold">${Number(unit.greenFramePrice || 0).toLocaleString()}</span></div>
                                  <div><span className="text-neutral-400">Renovation:</span> <span className="font-semibold">${Number(unit.renovationPrice || 0).toLocaleString()}</span></div>
                                  <div className="col-span-2 bg-red-50 p-1.5 rounded border border-red-100"><span className="text-neutral-500 font-medium">Turnkey Price:</span> <span className="font-bold text-red-600 ml-1">${Number(unit.turnkeyPrice || 0).toLocaleString()}</span></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                          <tr>
                            {canEdit && (
                              <th className="px-4 py-3 w-10">
                                <input
                                  type="checkbox"
                                  checked={paginatedUnits.length > 0 && paginatedUnits.every((u: any) => selectedUnitIds.includes(u.id))}
                                  onChange={() => {
                                    const allSelected = paginatedUnits.length > 0 && paginatedUnits.every((u: any) => selectedUnitIds.includes(u.id))
                                    if (allSelected) {
                                      const paginatedIds = paginatedUnits.map((u: any) => u.id)
                                      setSelectedUnitIds(prev => prev.filter(id => !paginatedIds.includes(id)))
                                    } else {
                                      const paginatedIds = paginatedUnits.map((u: any) => u.id)
                                      setSelectedUnitIds(prev => Array.from(new Set([...prev, ...paginatedIds])))
                                    }
                                  }}
                                  className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                />
                              </th>
                            )}
                            <th className="px-6 py-3">Unit #</th>
                            <th className="px-6 py-3">Tower/Block</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Floor</th>
                            <th className="px-6 py-3">Beds/Baths</th>
                            <th className="px-6 py-3">Size (m²)</th>
                            <th className="px-6 py-3">Price/m²</th>
                            <th className="px-6 py-3">Total Price</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUnits.map((unit: any) => (
                            <Fragment key={unit.id}>
                              <tr key={unit.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                                {canEdit && (
                                  <td className="px-4 py-4 w-10">
                                    <input
                                      type="checkbox"
                                      checked={selectedUnitIds.includes(unit.id)}
                                      onChange={() => {
                                        setSelectedUnitIds(prev => prev.includes(unit.id) ? prev.filter(i => i !== unit.id) : [...prev, unit.id])
                                      }}
                                      className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                    />
                                  </td>
                                )}
                                <td className="px-6 py-4 font-medium">
                                  {unit.unitNumber || '—'}
                                  {unit.floorPlanUrl && <a href={unit.floorPlanUrl} target="_blank" rel="noreferrer" className="block text-[10px] text-blue-600 hover:underline mt-1">View Plan</a>}
                                </td>
                                <td className="px-6 py-4 text-neutral-600">{unit.towerBlock || '—'}</td>
                                <td className="px-6 py-4 text-neutral-600">{UNIT_TYPE_LABELS[unit.type] || unit.type?.toLowerCase() || '—'}</td>
                                <td className="px-6 py-4 text-neutral-600">{unit.floor ?? '—'}</td>
                                <td className="px-6 py-4 text-neutral-600">
                                  {unit.bedrooms !== undefined && unit.bedrooms !== null ? unit.bedrooms : '—'} / {unit.bathrooms !== undefined && unit.bathrooms !== null ? unit.bathrooms : '—'}
                                </td>
                                <td className="px-6 py-4 text-neutral-600">{unit.size ? Number(unit.size).toLocaleString() : '—'}</td>
                                <td className="px-6 py-4 text-neutral-600">{unit.priceSqm ? `$${Number(unit.priceSqm).toLocaleString()}` : '—'}</td>
                                <td className="px-6 py-4 font-medium">{unit.price ? `$${Number(unit.price).toLocaleString()}` : '—'}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full font-medium ${UNIT_STATUS_COLORS[unit.status]}`}>{unit.status}</span></td>
                                <td className="px-6 py-4 text-right flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-neutral-500 hover:text-blue-600 h-8 px-2"
                                    onClick={() => {
                                      if (expandedViewUnitId === unit.id) {
                                        setExpandedViewUnitId(null)
                                      } else {
                                        setExpandedViewUnitId(unit.id)
                                        setExpandedEditUnitId(null)
                                      }
                                    }}
                                  >
                                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                                  </Button>
                                  {canEdit ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-neutral-500 hover:text-blue-600 h-8 px-2"
                                        onClick={() => {
                                          if (expandedEditUnitId === unit.id) {
                                            setExpandedEditUnitId(null)
                                            setEditingUnit(null)
                                            resetUnit()
                                          } else {
                                            openEditUnit(unit)
                                          }
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-red-600 h-8 px-2" onClick={() => {
                                         if (confirm(`Are you sure you want to delete unit ${unit.unitNumber || 'this unit'}?`)) {
                                           deleteUnitMutation.mutate(unit.id)
                                         }
                                       }}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-neutral-400 text-xs">Read-only</span>
                                  )}
                                </td>
                              </tr>

                              {/* Inline View Panel */}
                              {expandedViewUnitId === unit.id && (
                                <tr key={`view-${unit.id}`} className="bg-neutral-50/80 border-b">
                                  <td colSpan={canEdit ? 11 : 10} className="p-4 whitespace-normal">
                                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
                                      <div className="flex justify-between items-center border-b pb-2">
                                        <h4 className="font-bold text-neutral-800">Unit Details — {unit.unitNumber || 'Unnamed Unit'}</h4>
                                        <Button variant="ghost" size="sm" onClick={() => setExpandedViewUnitId(null)}>Close</Button>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                                        <div><span className="text-neutral-400 block font-medium">Unit #</span><span className="font-semibold text-neutral-800">{unit.unitNumber || '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Tower/Block</span><span className="font-semibold text-neutral-800">{unit.towerBlock || '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Building</span><span className="font-semibold text-neutral-800">{unit.building || '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Type</span><span className="font-semibold text-neutral-800">{UNIT_TYPE_LABELS[unit.type] || unit.type || '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Status</span><span className="font-semibold text-neutral-800">{unit.status}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Floor</span><span className="font-semibold text-neutral-800">{unit.floor ?? '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">View</span><span className="font-semibold text-neutral-800">{unit.view || '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Bedrooms</span><span className="font-semibold text-neutral-800">{unit.bedrooms ?? '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Bathrooms</span><span className="font-semibold text-neutral-800">{unit.bathrooms ?? '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Total Size</span><span className="font-semibold text-neutral-800">{unit.size ? `${unit.size} m²` : '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Price / m²</span><span className="font-semibold text-neutral-800">{unit.priceSqm ? `$${Number(unit.priceSqm).toLocaleString()}` : '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Total Price</span><span className="font-semibold text-neutral-800">{unit.price ? `$${Number(unit.price).toLocaleString()}` : '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Delivery Form</span><span className="font-semibold text-neutral-800">{unit.deliveryForm || '—'}</span></div>
                                        <div><span className="text-neutral-400 block font-medium">Handover</span><span className="font-semibold text-neutral-800">{unit.handover ? new Date(unit.handover).toLocaleDateString() : '—'}</span></div>
                                        {unit.floorPlanUrl && (
                                          <div className="col-span-2 sm:col-span-3"><span className="text-neutral-400 block font-medium">Floor Plan URL 1</span><a href={unit.floorPlanUrl} target="_blank" rel="noreferrer" className="text-red-600 hover:underline font-semibold">{unit.floorPlanUrl}</a></div>
                                        )}
                                        {unit.floorPlanUrl2 && (
                                          <div className="col-span-2 sm:col-span-3"><span className="text-neutral-400 block font-medium">Floor Plan URL 2</span><a href={unit.floorPlanUrl2} target="_blank" rel="noreferrer" className="text-red-600 hover:underline font-semibold">{unit.floorPlanUrl2}</a></div>
                                        )}
                                      </div>
                                      {(unit.livingAreaSize || unit.balconySize || unit.terraceSize || unit.greenyardSize) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-neutral-100">
                                          {unit.livingAreaSize && <div><span className="text-neutral-400 block">Living Area</span><span className="font-semibold">{unit.livingAreaSize} m²</span></div>}
                                          {unit.balconySize && <div><span className="text-neutral-400 block">Balcony</span><span className="font-semibold">{unit.balconySize} m²</span></div>}
                                          {unit.terraceSize && <div><span className="text-neutral-400 block">Terrace</span><span className="font-semibold">{unit.terraceSize} m²</span></div>}
                                          {unit.greenyardSize && <div><span className="text-neutral-400 block">Greenyard</span><span className="font-semibold">{unit.greenyardSize} m²</span></div>}
                                        </div>
                                      )}
                                      {(unit.blackFramePrice || unit.whiteFramePrice || unit.greenFramePrice || unit.turnkeyPrice || unit.renovationPrice) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-2 border-t border-neutral-100">
                                          {unit.blackFramePrice && (
                                            <div>
                                              <span className="text-neutral-400 block">Black Frame Price</span>
                                              <span className="font-semibold">${Number(unit.blackFramePrice).toLocaleString()}</span>
                                              {unit.blackFramePriceSqm && <span className="text-[10px] text-neutral-500 block">(${Number(unit.blackFramePriceSqm).toLocaleString()} / m²)</span>}
                                            </div>
                                          )}
                                          {unit.whiteFramePrice && (
                                            <div>
                                              <span className="text-neutral-400 block">White Frame Price</span>
                                              <span className="font-semibold">${Number(unit.whiteFramePrice).toLocaleString()}</span>
                                              {unit.whiteFramePriceSqm && <span className="text-[10px] text-neutral-500 block">(${Number(unit.whiteFramePriceSqm).toLocaleString()} / m²)</span>}
                                            </div>
                                          )}
                                          {unit.greenFramePrice && (
                                            <div>
                                              <span className="text-neutral-400 block">Green Frame Price</span>
                                              <span className="font-semibold">${Number(unit.greenFramePrice).toLocaleString()}</span>
                                              {unit.greenFramePriceSqm && <span className="text-[10px] text-neutral-500 block">(${Number(unit.greenFramePriceSqm).toLocaleString()} / m²)</span>}
                                            </div>
                                          )}
                                          {unit.turnkeyPrice && (
                                            <div>
                                              <span className="text-neutral-400 block">Turnkey Price</span>
                                              <span className="font-semibold">${Number(unit.turnkeyPrice).toLocaleString()}</span>
                                              {unit.turnkeyCalcMethod && <span className="text-[10px] text-neutral-500 block">({unit.turnkeyCalcMethod === 'LIVING_AREA' ? 'Living Area' : 'Total Area'})</span>}
                                            </div>
                                          )}
                                          {unit.renovationPrice && (
                                            <div>
                                              <span className="text-neutral-400 block">Renovation Price</span>
                                              <span className="font-semibold">${Number(unit.renovationPrice).toLocaleString()}</span>
                                              {unit.renovationPriceSqm && <span className="text-[10px] text-neutral-500 block">(${Number(unit.renovationPriceSqm).toLocaleString()} / m²)</span>}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                          {expandedEditUnitId === unit.id && canEdit && (
                            <tr key={`edit-${unit.id}`} className="bg-red-50/20 border-b">
                              <td colSpan={canEdit ? 11 : 10} className="p-4 whitespace-normal">
                                <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-4">
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <h4 className="font-bold text-neutral-800">Edit Unit — {unit.unitNumber || 'Unnamed Unit'}</h4>
                                    <Button variant="ghost" size="sm" onClick={() => { setExpandedEditUnitId(null); setEditingUnit(null); resetUnit(); }}>Cancel</Button>
                                  </div>

                                  <form onSubmit={handleUnit((data) => createUnitMutation.mutate(data))} className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                                      <div className="space-y-1"><Label>Unit Number</Label><Input placeholder="A-101" {...regUnit('unitNumber')} /></div>
                                      <div className="space-y-1"><Label>Tower/Block</Label><Input placeholder="e.g. Tower A" {...regUnit('towerBlock')} /></div>
                                      <div className="space-y-1"><Label>Building</Label><Input placeholder="e.g. Building 1" {...regUnit('building')} /></div>
                                      <div className="space-y-1"><Label>Type</Label>
                                        <select {...regUnit('type')} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
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
                                      <div className="space-y-1"><Label>Handover</Label><Input type="date" {...regUnit('handover')} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                      <div className="space-y-1"><Label>Bedrooms</Label><Input type="number" min={0} {...regUnit('bedrooms')} /></div>
                                      <div className="space-y-1"><Label>Bathrooms</Label><Input type="number" min={0} {...regUnit('bathrooms')} /></div>
                                      <div className="space-y-1"><Label>Floor</Label><Input type="number" min={0} {...regUnit('floor')} /></div>
                                      <div className="space-y-1"><Label>Size (m²)</Label><Input type="number" step="0.01" {...regUnit('size')} /></div>
                                      <div className="space-y-1"><Label>Turnkey Price / m² (USD)</Label><Input type="number" step="0.01" placeholder="e.g. 1000" {...regUnit('priceSqm')} /></div>
                                      <div className="space-y-1"><Label>Total Price (USD)</Label><Input type="number" step="0.01" {...regUnit('price')} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                      <div className="space-y-1"><Label>Living Area (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 85.5" {...regUnit('livingAreaSize')} /></div>
                                      <div className="space-y-1"><Label>Balcony (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 10.2" {...regUnit('balconySize')} /></div>
                                      <div className="space-y-1"><Label>Terrace (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 15.0" {...regUnit('terraceSize')} /></div>
                                      <div className="space-y-1"><Label>Greenyard (m²)</Label><Input type="number" step="0.01" placeholder="e.g. 25.4" {...regUnit('greenyardSize')} /></div>
                                      <div className="space-y-1"><Label>Delivery Form</Label><Input placeholder="e.g. Turnkey" {...regUnit('deliveryForm')} /></div>
                                    </div>

                                    <div className="border border-neutral-100 p-3 rounded-lg bg-neutral-50/50 space-y-3">
                                      <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Frames Options &amp; Pricing</Label>
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="flex items-center space-x-2">
                                          <input type="checkbox" id={`unit-blackFrame-${unit.id}`} {...regUnit('blackFrame')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                                          <label htmlFor={`unit-blackFrame-${unit.id}`} className="text-sm font-medium text-neutral-700 select-none cursor-pointer">Black Frame</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input type="checkbox" id={`unit-whiteFrame-${unit.id}`} {...regUnit('whiteFrame')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                                          <label htmlFor={`unit-whiteFrame-${unit.id}`} className="text-sm font-medium text-neutral-700 select-none cursor-pointer">White Frame</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input type="checkbox" id={`unit-greenFrame-${unit.id}`} {...regUnit('greenFrame')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                                          <label htmlFor={`unit-greenFrame-${unit.id}`} className="text-sm font-medium text-neutral-700 select-none cursor-pointer">Green Frame</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input type="checkbox" id={`unit-turnkey-${unit.id}`} {...regUnit('turnkey')} className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4" />
                                          <label htmlFor={`unit-turnkey-${unit.id}`} className="text-sm font-medium text-neutral-700 select-none cursor-pointer">Turnkey</label>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-1">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Black Frame / sqm (USD)</Label>
                                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('blackFramePriceSqm')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">White Frame / sqm (USD)</Label>
                                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('whiteFramePriceSqm')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Green Frame / sqm (USD)</Label>
                                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('greenFramePriceSqm')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Renovation / sqm (USD)</Label>
                                          <Input type="number" step="0.01" placeholder="Price / sqm..." {...regUnit('renovationPriceSqm')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Turnkey Price Option</Label>
                                          <select {...regUnit('turnkeyCalcMethod')} className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                                            <option value="TOTAL_AREA">Total Area × Turnkey Price / sqm</option>
                                            <option value="LIVING_AREA">Living Area × Turnkey Price / sqm</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-1">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Black Frame Price Total</Label>
                                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('blackFramePrice')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">White Frame Price Total</Label>
                                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('whiteFramePrice')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Green Frame Price Total</Label>
                                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('greenFramePrice')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Renovation Price Total</Label>
                                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('renovationPrice')} />
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Turnkey Price Total</Label>
                                          <Input type="number" step="0.01" placeholder="Calculated..." {...regUnit('turnkeyPrice')} />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                      <Button type="submit" disabled={createUnitMutation.isPending} className="bg-red-600 hover:bg-red-700">
                                        {createUnitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Unit
                                      </Button>
                                      <Button type="button" variant="outline" onClick={() => { setExpandedEditUnitId(null); setEditingUnit(null); resetUnit(); }}>Cancel</Button>
                                    </div>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
              </CardContent>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 bg-white sm:px-6 rounded-b-xl">
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
            </Card>
          </div>
        )
      })()}

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
              <Button onClick={() => { setEditingPlanId(null); setPlanName(''); setPlanDesc(''); setPlanUnitId(null); setPlanSchedule([]); setShowAddPlan(true); }} className="bg-red-600 hover:bg-red-700"><Plus className="w-4 h-4 mr-2" /> Add Plan</Button>
            )}
          </div>
          {showAddPlan && canEdit && (
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">{editingPlanId ? 'Edit Payment Plan' : 'New Payment Plan'}</CardTitle></CardHeader>
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
                  <Button onClick={() => editingPlanId ? updatePlanMutation.mutate() : createPlanMutation.mutate()} disabled={!planName || (editingPlanId ? updatePlanMutation.isPending : createPlanMutation.isPending)} className="bg-red-600 hover:bg-red-700">
                    {(editingPlanId ? updatePlanMutation.isPending : createPlanMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddPlan(false); setEditingPlanId(null); setPlanSchedule([]); }}>Cancel</Button>
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
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-blue-600 h-8 px-2" onClick={() => {
                            setEditingPlanId(plan.id)
                            setPlanName(plan.name)
                            setPlanDesc(plan.description || '')
                            setPlanUnitId(plan.unitId || null)
                            setPlanSchedule(plan.schedule || [])
                            setShowAddPlan(true)
                          }}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600" onClick={() => {
                             if (confirm(`Are you sure you want to delete payment plan "${plan.name}"?`)) {
                               deletePlanMutation.mutate(plan.id)
                             }
                           }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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

                      {/* Media File Name Overlay */}
                      <div className="absolute bottom-0 inset-x-0 bg-slate-900/75 backdrop-blur-[2px] text-white text-[11px] px-2 py-1 truncate z-10 font-medium">
                        {file.name || file.url.split('/').pop()}
                      </div>

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
                              const newName = prompt('Enter new name:', file.name || file.url.split('/').pop())
                              if (newName !== null && newName.trim() !== '') {
                                renameMediaMutation.mutate({ id: file.id, name: newName.trim() })
                              }
                            }}
                            className="bg-white hover:bg-neutral-100 text-neutral-700 rounded-lg p-1.5 shadow-md border border-neutral-200"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
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
      {showBulkFloorPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white shadow-xl flex flex-col my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-xl font-bold">Assign Floor Plan to Units</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowBulkFloorPlan(false)
                setBulkFloorPlanUrl('')
                setBulkFloorPlanBeds('')
                setBulkFloorPlanType('')
              }}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-neutral-700">Floor Plan Image URL *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={bulkFloorPlanUrl}
                    onChange={e => setBulkFloorPlanUrl(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <input
                    type="file"
                    id="bulk-floorplan-upload-input"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files
                      if (!files || files.length === 0) return
                      setBulkFloorPlanUploading(true)
                      try {
                        const formData = new FormData()
                        formData.append('file', files[0])
                        formData.append('type', 'FLOOR_PLAN')
                        const res = await fetch('/api/uploads', { method: 'POST', body: formData })
                        const data = await res.json()
                        if (res.ok) {
                          setBulkFloorPlanUrl(data.url)
                          toast.success('Floor plan uploaded!')
                        } else {
                          throw new Error(data.error)
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Upload failed')
                      } finally {
                        setBulkFloorPlanUploading(false)
                      }
                    }}
                  />
                  <label htmlFor="bulk-floorplan-upload-input" className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-neutral-200 bg-neutral-50 px-3 cursor-pointer hover:bg-neutral-100 shadow-sm text-neutral-600">
                    {bulkFloorPlanUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </label>
                </div>
                {projectFloorPlans.length > 0 && (
                  <select
                    value={bulkFloorPlanUrl}
                    onChange={e => setBulkFloorPlanUrl(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 mt-2"
                  >
                    <option value="">Or pick existing project floor plan...</option>
                    {projectFloorPlans.map((fp: any) => (
                      <option key={fp.id} value={fp.url}>{fp.name || fp.url.split('/').pop()}</option>
                    ))}
                  </select>
                )}
              </div>

              {bulkFloorPlanUrl && (
                <div className="border rounded-lg overflow-hidden h-36 bg-neutral-50 flex items-center justify-center p-2">
                  <img src={bulkFloorPlanUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded" />
                </div>
              )}

              <div className="space-y-3 pt-2 border-t">
                <Label className="text-xs font-semibold text-neutral-800">Target Units Filter</Label>
                
                {selectedUnitIds.length > 0 ? (
                  <div className="p-3 bg-red-50 rounded-md border border-red-100 text-xs text-red-700">
                    💡 Applying to <strong>{selectedUnitIds.length} checked unit(s)</strong> in table.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Bedrooms</Label>
                      <select
                        value={bulkFloorPlanBeds}
                        onChange={e => setBulkFloorPlanBeds(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">All Bedrooms</option>
                        {[0, 1, 2, 3, 4, 5].map(b => (
                          <option key={b} value={b}>{b} Bed</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unit Type</Label>
                      <select
                        value={bulkFloorPlanType}
                        onChange={e => setBulkFloorPlanType(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">All Types</option>
                        {Object.entries(UNIT_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setShowBulkFloorPlan(false)
                  setBulkFloorPlanUrl('')
                  setBulkFloorPlanBeds('')
                  setBulkFloorPlanType('')
                }}>Cancel</Button>
                <Button
                  disabled={bulkFloorPlanSubmitting || !bulkFloorPlanUrl}
                  onClick={async () => {
                    setBulkFloorPlanSubmitting(true)
                    try {
                      const res = await fetch(`/api/cms/projects/${id}/units/bulk-floor-plan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          floorPlanUrl: bulkFloorPlanUrl,
                          unitIds: selectedUnitIds.length > 0 ? selectedUnitIds : undefined,
                          bedrooms: bulkFloorPlanBeds !== '' ? Number(bulkFloorPlanBeds) : undefined,
                          type: bulkFloorPlanType !== '' ? bulkFloorPlanType : undefined
                        })
                      })
                      const result = await res.json()
                      if (res.ok) {
                        toast.success(`Floor plan assigned to ${result.count} unit(s)!`)
                        queryClient.invalidateQueries({ queryKey: ['units', id] })
                        setShowBulkFloorPlan(false)
                        setBulkFloorPlanUrl('')
                        setBulkFloorPlanBeds('')
                        setBulkFloorPlanType('')
                      } else {
                        throw new Error(result.error || 'Failed to apply floor plan')
                      }
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to assign floor plan')
                    } finally {
                      setBulkFloorPlanSubmitting(false)
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {bulkFloorPlanSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Assign Floor Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle className="text-xl font-bold">Bulk Upload Units</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowBulkUpload(false)
                setBulkFile(null)
                setBulkHeaders([])
                setBulkRows([])
                setBulkMapping({})
                setBulkTurnkeyCalcMethod('TOTAL_AREA')
              }}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1">
              {!bulkFile ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-xl p-8 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                  <Upload className="w-10 h-10 text-neutral-400 mb-3" />
                  <p className="text-sm font-medium text-neutral-700 mb-1">Upload CSV file</p>
                  <p className="text-xs text-neutral-500 mb-4">File must contain unit data with columns for headers</p>
                  <input
                    type="file"
                    id="bulk-csv-upload"
                    accept=".csv"
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files
                      if (!files || files.length === 0) return
                      const file = files[0]
                      setBulkFile(file)
                      const reader = new FileReader()
                      reader.onload = (evt) => {
                        const text = evt.target?.result as string
                        const parsed = parseCSV(text)
                        if (parsed.length > 0) {
                          const headers = parsed[0]
                          const dataRows = parsed.slice(1)
                          const rows = dataRows.map(row => {
                            const obj: any = {}
                            headers.forEach((h, idx) => {
                              obj[h] = row[idx]
                            })
                            return obj
                          })
                          setBulkHeaders(headers)
                          setBulkRows(rows)

                          // Auto map
                          const initialMapping: Record<string, string> = {}
                          UNIT_FIELDS.forEach(f => {
                            initialMapping[f.key] = autoMap(f.key, headers)
                          })
                          setBulkMapping(initialMapping)
                        } else {
                          toast.error('File seems empty or invalid')
                          setBulkFile(null)
                        }
                      }
                      reader.readAsText(file)
                    }}
                  />
                  <label htmlFor="bulk-csv-upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white h-9 px-4 py-2 cursor-pointer shadow transition-colors">
                    Select File
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-neutral-50 border rounded-lg p-3 text-sm text-neutral-600 flex items-center justify-between">
                    <span>Selected: <strong>{bulkFile.name}</strong> ({bulkRows.length} rows found)</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={() => {
                      setBulkFile(null)
                      setBulkHeaders([])
                      setBulkRows([])
                      setBulkMapping({})
                      setBulkTurnkeyCalcMethod('TOTAL_AREA')
                    }}>Change file</Button>
                  </div>

                  <div className="bg-neutral-50 border rounded-lg p-3 space-y-2">
                    <div className="flex flex-col space-y-1">
                      <Label className="font-semibold text-neutral-800 text-sm">Turnkey Price Option</Label>
                      <span className="text-xs text-neutral-500 font-medium">Select method to automatically calculate Turnkey Price total during import (requires Turnkey Price / sqm to be mapped)</span>
                    </div>
                    <select
                      value={bulkTurnkeyCalcMethod}
                      onChange={e => setBulkTurnkeyCalcMethod(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="TOTAL_AREA">Total Area × Turnkey Price / sqm</option>
                      <option value="LIVING_AREA">Living Area × Turnkey Price / sqm</option>
                      <option value="NONE">Leave empty</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <Label className="font-semibold text-neutral-800 text-sm">Column Mapping</Label>
                      <span className="text-xs text-neutral-500">Map database fields to CSV columns</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-1">
                      {UNIT_FIELDS.map(f => (
                        <div key={f.key} className="space-y-1">
                          <Label className="text-xs text-neutral-600 font-medium">{f.label}</Label>
                          <select
                            value={bulkMapping[f.key] || ''}
                            onChange={e => {
                              setBulkMapping(prev => ({ ...prev, [f.key]: e.target.value }))
                            }}
                            className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                          >
                            <option value="">(Ignore / Left empty)</option>
                            {bulkHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => {
                      setShowBulkUpload(false)
                      setBulkFile(null)
                      setBulkHeaders([])
                      setBulkRows([])
                      setBulkMapping({})
                      setBulkTurnkeyCalcMethod('TOTAL_AREA')
                    }}>Cancel</Button>
                    <Button
                      disabled={bulkUploading || !bulkMapping['unitNumber']}
                      onClick={async () => {
                        setBulkUploading(true)
                        try {
                          const res = await fetch(`/api/cms/projects/${id}/units/bulk-upload`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rows: bulkRows, mapping: bulkMapping, turnkeyCalcMethod: bulkTurnkeyCalcMethod })
                          })
                          const result = await res.json()
                          if (res.ok) {
                            toast.success(`Upload complete! Created ${result.createdCount} and updated ${result.updatedCount} units.`)
                            queryClient.invalidateQueries({ queryKey: ['units', id] })
                            setShowBulkUpload(false)
                            setBulkFile(null)
                            setBulkHeaders([])
                            setBulkRows([])
                            setBulkMapping({})
                            setBulkTurnkeyCalcMethod('TOTAL_AREA')
                          } else {
                            throw new Error(result.error || 'Failed to upload')
                          }
                        } catch (err: any) {
                          toast.error(err.message || 'Upload failed')
                        } finally {
                          setBulkUploading(false)
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {bulkUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Start Import
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <FileUploadProgressModal
        progressInfo={progressInfo}
        onCancel={cancelUpload}
        onClose={resetProgress}
      />
    </div>
  )
}

const UNIT_FIELDS = [
  { key: 'unitNumber', label: 'Unit Number *' },
  { key: 'type', label: 'Unit Type' },
  { key: 'bedrooms', label: 'Bedrooms' },
  { key: 'bathrooms', label: 'Bathrooms' },
  { key: 'size', label: 'Size (m²)' },
  { key: 'price', label: 'Price (USD)' },
  { key: 'status', label: 'Status' },
  { key: 'view', label: 'View' },
  { key: 'floor', label: 'Floor' },
  { key: 'livingAreaSize', label: 'Living Area Size' },
  { key: 'balconySize', label: 'Balcony Size' },
  { key: 'terraceSize', label: 'Terrace Size' },
  { key: 'greenyardSize', label: 'Greenyard Size' },
  { key: 'deliveryForm', label: 'Delivery Form' },
  { key: 'blackFramePrice', label: 'Black Frame Price' },
  { key: 'whiteFramePrice', label: 'White Frame Price' },
  { key: 'greenFramePrice', label: 'Green Frame Price' },
  { key: 'turnkeyPrice', label: 'Turnkey Price' },
  { key: 'floorPlanUrl', label: 'Floor Plan URL' },
  { key: 'building', label: 'Building' },
  { key: 'towerBlock', label: 'Tower/Block' },
  { key: 'priceSqm', label: 'Price per sqm' },
  { key: 'blackFramePriceSqm', label: 'Black Frame Price per sqm' },
  { key: 'whiteFramePriceSqm', label: 'White Frame Price per sqm' },
  { key: 'greenFramePriceSqm', label: 'Green Frame Price per sqm' },
  { key: 'renovationPrice', label: 'Renovation Price' },
  { key: 'renovationPriceSqm', label: 'Renovation Price per sqm' },
  { key: 'handover', label: 'Handover Date' },
  { key: 'turnkeyCalcMethod', label: 'Turnkey Calc Method' }
]

function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let inQuotes = false
  let entry = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i+1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim())
      entry = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      row.push(entry.trim())
      if (row.length > 0 && row.some(cell => cell !== '')) {
        lines.push(row)
      }
      row = []
      entry = ''
    } else {
      entry += char
    }
  }
  if (entry || row.length > 0) {
    row.push(entry.trim())
    if (row.some(cell => cell !== '')) {
      lines.push(row)
    }
  }
  return lines
}

function autoMap(fieldKey: string, headers: string[]): string {
  const k = fieldKey.toLowerCase().replace(/[^a-z0-9]/g, '')
  const found = headers.find(h => {
    const normalizedH = h.toLowerCase().replace(/[^a-z0-9]/g, '')
    return normalizedH === k || normalizedH.includes(k) || k.includes(normalizedH)
  })
  return found || ''
}
