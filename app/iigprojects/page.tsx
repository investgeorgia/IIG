"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Cormorant_Garamond } from 'next/font/google'
import { toast } from 'sonner'
import { 
  ChevronLeft, 
  ChevronRight, 
  CircleDollarSign, 
  Home, 
  Calendar, 
  Maximize, 
  TrendingUp, 
  Clock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  UserCheck,
  Mail,
  RefreshCw,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { projectsData, Project } from './data'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

// Comprehensive country calling codes and names
const COUNTRY_LIST = [
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: '+963', name: 'Syria', flag: '🇸🇾' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: '+77', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+374', name: 'Armenia', flag: '🇦🇲' },
  { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+992', name: 'Tajikistan', flag: '🇹🇯' },
  { code: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+255', name: 'Tanzania', flag: '🇹ℤ' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+221', name: 'Senegal', flag: '🇸🇳' },
]

interface DropdownItem {
  code: string
  name: string
  flag: string
}

const validateEmail = (emailStr: string): { valid: boolean; error?: string } => {
  const trimmed = emailStr.trim().toLowerCase()
  if (!trimmed) return { valid: false, error: 'Email address is required' }
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@domain.com)' }
  }
  const [localPart, domainPart] = trimmed.split('@')
  const spamPrefixes = ['xyz', 'test', 'asdf', 'abc', 'fake', '123', 'admin', 'user', 'sample', 'demo', 'qwerty', 'temp', 'null', 'undefined', 'aaa', 'bbb', 'ccc', 'xxx', 'yyy', 'zzz']
  if (spamPrefixes.includes(localPart) || localPart.length < 2) {
    return { valid: false, error: 'Please enter a valid personal or business email address' }
  }
  const invalidDomains = ['test.com', 'example.com', 'invalid.com', 'fake.com', 'domain.com', 'temp.com', 'mailinator.com', 'yopmail.com', 'gamil.com', 'gmaill.com', 'hotmial.com']
  if (invalidDomains.includes(domainPart)) {
    return { valid: false, error: 'Please enter a valid email domain name' }
  }
  return { valid: true }
}

function SearchableDropdown({
  items,
  value,
  onChange,
  placeholder,
  displayFormat,
  matchKey,
  disabled,
}: {
  items: DropdownItem[]
  value: string
  onChange: (item: DropdownItem) => void
  placeholder: string
  displayFormat: (item: DropdownItem) => string
  matchKey: 'code' | 'name'
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedItem = items.find((item) => item[matchKey] === value)
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="searchable-dropdown-btn"
      >
        <span className="truncate">
          {selectedItem ? displayFormat(selectedItem) : placeholder}
        </span>
        <span style={{ color: '#94a3b8', fontSize: '10px', marginLeft: '4px' }}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-zinc-500 font-normal"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <li key={item.name + '-' + item.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(item)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-sm shrink-0">{item.flag}</span>
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-slate-400 ml-auto shrink-0 text-[11px]">{item.code}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-xs text-slate-400 text-center">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function IIGProjectsPage() {
  const [projectsList, setProjectsList] = useState<Project[]>(projectsData)
  const [activeProjectId, setActiveProjectId] = useState<number>(projectsData[0].id)
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0)
  
  const initialDefaultImg = projectsData[0]?.images?.[0] || projectsData[0]?.thumbnail || ''
  const initialFormattedImg = initialDefaultImg ? (initialDefaultImg.startsWith('/') ? initialDefaultImg : `/${initialDefaultImg}`) : ''
  const [bgImage, setBgImage] = useState<string>(initialFormattedImg)
  const [bgOpacity, setBgOpacity] = useState<number>(1)
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)
  const [imageNameOpacity, setImageNameOpacity] = useState<number>(1)

  const [isUIHidden, setIsUIHidden] = useState<boolean>(false)

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [loadProgress, setLoadProgress] = useState<number>(0)

  // Salesperson referral system state
  const [salesperson, setSalesperson] = useState<any>(null)
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // IPS Contact Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formCountryCode, setFormCountryCode] = useState('+971')
  const [formPhone, setFormPhone] = useState('')
  const [formPreferredContactMode, setFormPreferredContactMode] = useState('WhatsApp')
  const [formLanguage, setFormLanguage] = useState('English')
  const [formRole, setFormRole] = useState('investor')
  const [formSource, setFormSource] = useState('website')
  const [formError, setFormError] = useState<string | null>(null)

  // Capture lead source from URL query params or sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlSource = params.get('source') || params.get('utm_source')
      if (urlSource) {
        setFormSource(urlSource)
        try {
          sessionStorage.setItem('lead_source', urlSource)
        } catch (e) {
          console.warn('Could not store lead source in sessionStorage:', e)
        }
      } else {
        try {
          const storedSource = sessionStorage.getItem('lead_source')
          if (storedSource) {
            setFormSource(storedSource)
          }
        } catch (e) {
          console.warn('Could not read lead source from sessionStorage:', e)
        }
      }
    }
  }, [])

  // Email OTP verification state
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', ''])
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  // OTP Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showOtpModal && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showOtpModal, resendTimer])

  // OTP Handlers
  const sendOtpCode = async (targetEmail?: string) => {
    const emailToSend = targetEmail || formEmail.trim().toLowerCase()

    const emailCheck = validateEmail(emailToSend)
    if (!emailCheck.valid) {
      toast.error(emailCheck.error || 'Please enter a valid email address')
      return
    }

    setIsSendingOtp(true)
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: emailToSend, type: 'email' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      toast.success(data.message || `Verification code sent to ${emailToSend}`)
      setShowOtpModal(true)
      setOtpDigits(['', '', '', ''])
      setFailedAttempts(0)
      setResendTimer(60)
      setCanResend(false)

      setTimeout(() => {
        otpInputRefs[0].current?.focus()
      }, 100)

    } catch (err: any) {
      toast.error(err.message || 'Could not send verification code')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const verifyOtpCode = async () => {
    const code = otpDigits.join('')
    if (code.length !== 4) {
      toast.error('Please enter the complete 4-digit code')
      return
    }

    setIsVerifyingOtp(true)
    const targetEmail = formEmail.trim().toLowerCase()

    try {
      const verifyRes = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetEmail, code })
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        const attempts = (failedAttempts + 1)
        setFailedAttempts(attempts)
        throw new Error(verifyData.error || 'Incorrect verification code')
      }

      // Verification Success!
      setIsEmailVerified(true)
      setShowOtpModal(false)
      toast.success('Email address verified successfully!')

    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleVerifyEmailClick = (e: React.MouseEvent) => {
    e.preventDefault()
    sendOtpCode()
  }

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '')
    const newDigits = [...otpDigits]
    newDigits[index] = cleanValue.slice(-1)
    setOtpDigits(newDigits)

    if (cleanValue && index < 3) {
      otpInputRefs[index + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4)
    if (pasted) {
      const digits = pasted.split('')
      const newDigits = ['', '', '', '']
      digits.forEach((d, i) => { if (i < 4) newDigits[i] = d })
      setOtpDigits(newDigits)
      if (digits.length === 4) {
        otpInputRefs[3].current?.focus()
      } else if (digits.length > 0) {
        otpInputRefs[Math.min(digits.length, 3)].current?.focus()
      }
    }
  }

  // Handle final IPS registration submit (Posting directly to Bitrix24 via /api/ips-registration)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim()) {
      setFormError('Please enter your full name')
      return
    }

    const emailCheck = validateEmail(formEmail)
    if (!emailCheck.valid) {
      setFormError(emailCheck.error || 'Please enter a valid email address')
      return
    }

    if (!formPhone.trim()) {
      setFormError('Please enter your phone number')
      return
    }

    if (!isEmailVerified) {
      setFormError('Please click "Verify Email" to verify your email address before submitting.')
      return
    }

    setIsSubmitting(true)
    const fullPhone = `${formCountryCode} ${formPhone.trim()}`

    try {
      const response = await fetch('/api/ips-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: fullPhone,
          preferredContactMode: formPreferredContactMode,
          language: formLanguage,
          role: formRole,
          source: formSource
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      toast.success(data.message || 'Registration successful!')
      setSubmitSuccess(true)
      setFormError(null)

      // Reset form
      setFormName('')
      setFormEmail('')
      setFormCountryCode('+971')
      setFormPhone('')
      setFormPreferredContactMode('WhatsApp')
      setFormLanguage('English')
      setFormRole('investor')
      setIsEmailVerified(false)
    } catch (error: any) {
      const msg = error.message || 'Failed to submit registration'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch dynamic projects, pre-cache all assets into browser memory & animate preloader screen
  useEffect(() => {
    let isMounted = true

    const loadAllDataAndAssets = async () => {
      let fetchedProjects: Project[] = projectsData
      try {
        const res = await fetch(`/api/iigprojects?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          fetchedProjects = data
          if (isMounted) {
            setProjectsList(data)
            setActiveProjectId(data[0].id)
            const firstImg = data[0].images?.[0] || data[0].thumbnail || ''
            if (firstImg) {
              const formatted = firstImg.startsWith('/') ? firstImg : `/${firstImg}`
              setBgImage(formatted)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic projects:', err)
      }

      // Fetch salesperson in parallel
      fetch('/api/salesperson/current')
        .then(res => res.json())
        .then(data => { if (data && isMounted) setSalesperson(data) })
        .catch(err => console.error('Error fetching salesperson', err))

      // Collect all image URLs across all projects to pre-decode into browser memory
      const urlsToPreload: string[] = []
      fetchedProjects.forEach(proj => {
        if (proj.thumbnail) {
          const formatted = proj.thumbnail.startsWith('/') ? proj.thumbnail : `/${proj.thumbnail}`
          if (!urlsToPreload.includes(formatted)) urlsToPreload.push(formatted)
        }
        if (proj.images && proj.images.length > 0) {
          proj.images.forEach(imgUrl => {
            const formatted = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`
            if (!urlsToPreload.includes(formatted) && !formatted.endsWith('.mp4') && !formatted.endsWith('.webm')) {
              urlsToPreload.push(formatted)
            }
          })
        }
      })

      let loadedCount = 0
      const totalCount = urlsToPreload.length || 1

      const updateProgress = () => {
        loadedCount++
        const targetPercent = Math.min(Math.round((loadedCount / totalCount) * 100), 100)
        if (isMounted) {
          setLoadProgress(prev => Math.max(prev, targetPercent))
        }
        if (loadedCount >= totalCount) {
          if (isMounted) {
            setLoadProgress(100)
            setTimeout(() => setIsInitialLoading(false), 250)
          }
        }
      }

      // Preload every image with 1000ms max per-image timeout to prevent hanging
      urlsToPreload.forEach(url => {
        const img = new Image()
        let resolved = false
        const handleDone = () => {
          if (!resolved) {
            resolved = true
            updateProgress()
          }
        }
        img.onload = handleDone
        img.onerror = handleDone
        img.src = url

        setTimeout(handleDone, 1000)
      })

      // Smooth ticker fallback so preloader continuously advances up to 100% within ~1.8 seconds max
      let currentP = 0
      const interval = setInterval(() => {
        if (!isMounted) {
          clearInterval(interval)
          return
        }
        currentP += 6
        const nextP = Math.min(currentP, 100)
        setLoadProgress(prev => Math.max(prev, nextP))

        if (nextP >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            if (isMounted) setIsInitialLoading(false)
          }, 250)
        }
      }, 70)
    }

    loadAllDataAndAssets()

    return () => {
      isMounted = false
    }
  }, [])

  // Track global pageview
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    fetch('/api/tracking/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        referrer_url: document.referrer || undefined
      })
    }).catch(err => console.error('Failed to track pageview', err))
  }, [])

  const carouselContainerRef = useRef<HTMLDivElement>(null)
  const bottomWrapperRef = useRef<HTMLDivElement>(null)
  
  // Touch swipe state
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const minSwipeDistance = 35

  const activeProject = projectsList.find(p => p.id === activeProjectId) || projectsList[0]
  const activeMediaUrl = activeProject?.images?.[activeImageIndex] || activeProject?.thumbnail || ''
  const isCurrentMediaVideo = activeMediaUrl?.endsWith('.mp4') || activeMediaUrl?.endsWith('.webm') || (activeProject as any)?.mediaDetails?.[activeImageIndex]?.type === 'VIDEO'

  // Check if project qualifies for VR 3D QR Code (Ortachala & Kavtaradze only)
  const isVRProject = (() => {
    if (!activeProject) return false
    const name = (activeProject.name || '').toLowerCase()
    const slug = ((activeProject as any).slug || '').toLowerCase()
    return (
      name.includes('ortachal') || slug.includes('ortachal') ||
      name.includes('kavtaradze') || name.includes('kavataradze') || slug.includes('kavtaradze') || slug.includes('kavataradze')
    )
  })()

  // Auto-reset to first project after 3 minutes of inactivity
  useEffect(() => {
    let idleTimer: NodeJS.Timeout

    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (projectsList && projectsList.length > 0) {
          setActiveProjectId(projectsList[0].id)
          setActiveImageIndex(0)
        }
      }, 3 * 60 * 1000)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }))

    resetIdleTimer()

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => window.removeEventListener(event, resetIdleTimer))
    }
  }, [projectsList])

  // Preload next image of active project for instant carousel browsing
  useEffect(() => {
    if (!activeProject || !activeProject.images || activeProject.images.length <= 1) return
    const nextIndex = (activeImageIndex + 1) % activeProject.images.length
    const nextUrl = activeProject.images[nextIndex]
    if (nextUrl && !nextUrl.endsWith('.mp4') && !nextUrl.endsWith('.webm')) {
      const nextImg = new Image()
      const formattedUrl = nextUrl.startsWith('/') ? nextUrl : `/${nextUrl}`
      nextImg.src = formattedUrl
    }
  }, [activeProjectId, activeImageIndex, activeProject])

  // Handle active image loading & instant display
  useEffect(() => {
    if (!activeProject || !activeProject.images || activeProject.images.length === 0) return

    const rawUrl = activeProject.images[activeImageIndex] || activeProject.thumbnail
    if (!rawUrl) return

    const formattedUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
    const isVid = formattedUrl.endsWith('.mp4') || formattedUrl.endsWith('.webm') || (activeProject as any)?.mediaDetails?.[activeImageIndex]?.type === 'VIDEO'

    setBgImage(formattedUrl)

    if (isVid) {
      setBgOpacity(1)
      setIsTransitioning(false)
      return
    }

    const img = new Image()
    img.src = formattedUrl

    if (img.complete) {
      setBgOpacity(1)
      setIsTransitioning(false)
    } else {
      setBgOpacity(0.4)
      setIsTransitioning(true)

      img.onload = () => {
        setBgOpacity(1)
        setIsTransitioning(false)
      }
      img.onerror = () => {
        setBgOpacity(1)
        setIsTransitioning(false)
      }
    }
  }, [activeImageIndex, activeProjectId, activeProject])

  // Select project handler
  const selectProject = (id: number) => {
    if (id === activeProjectId) return

    setImageNameOpacity(0)
    setBgOpacity(0.3)
    setIsTransitioning(true)

    setTimeout(() => {
      setActiveProjectId(id)
      setActiveImageIndex(0)

      setTimeout(() => {
        setImageNameOpacity(1)
      }, 50)
    }, 200)
  }

  // Prev / Next image navigation
  const handlePrevImage = () => {
    if (!activeProject || !activeProject.images || activeProject.images.length <= 1) return
    setActiveImageIndex(prev => (prev === 0 ? activeProject.images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    if (!activeProject || !activeProject.images || activeProject.images.length <= 1) return
    setActiveImageIndex(prev => (prev === activeProject.images.length - 1 ? 0 : prev + 1))
  }

  // Scroll thumbnails carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselContainerRef.current) return
    const scrollAmount = direction === 'left' ? -280 : 280
    carouselContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  // Drag to scroll carousel logic
  const isDragging = useRef(false)
  const isDragOccurring = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselContainerRef.current) return
    isDragging.current = true
    isDragOccurring.current = false
    startX.current = e.pageX - carouselContainerRef.current.offsetLeft
    scrollLeft.current = carouselContainerRef.current.scrollLeft
  }

  const handleMouseLeaveOrUp = () => {
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselContainerRef.current) return
    const x = e.pageX - carouselContainerRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    if (Math.abs(walk) > 5) {
      isDragOccurring.current = true
    }
    carouselContainerRef.current.scrollLeft = scrollLeft.current - walk
  }

  // Wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!carouselContainerRef.current) return
    if (e.deltaY !== 0) {
      carouselContainerRef.current.scrollLeft += e.deltaY
    }
  }

  // Touch handlers for full page swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY

    const diffX = touchStartX.current - currentX
    const diffY = touchStartY.current - currentY

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
          handleNextImage()
        } else {
          handlePrevImage()
        }
        touchStartX.current = 0
        touchStartY.current = 0
      }
    }
  }

  return (
    <div 
      className="portfolio-body text-white select-none overflow-hidden relative w-full h-screen font-sans"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Preloader Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 z-50 bg-[#0a0f18] flex flex-col items-center justify-center transition-opacity duration-500">
          <div className="flex flex-col items-center max-w-sm w-full px-6 text-center">
            <img 
              src="/logo.svg" 
              alt="Invest Georgia UAE Logo" 
              className="w-48 h-auto animate-pulse"
              style={{ marginBottom: '52px' }}
            />
            
            <div className="w-full bg-white/10 rounded-full h-1.5 mb-4 overflow-hidden p-0.5 border border-white/10">
              <div 
                className="bg-gradient-to-r from-[#ca2d39] via-red-500 to-[#ca2d39] h-full rounded-full transition-all duration-200 ease-out shadow-[0_0_12px_rgba(202,45,57,0.8)]"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between w-full text-[11px] uppercase tracking-widest text-white/60 font-medium">
              <span>Loading Portfolio</span>
              <span>{loadProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Background Media */}
      {isCurrentMediaVideo ? (
        <video
          key={bgImage}
          src={bgImage}
          autoPlay
          loop
          muted
          playsInline
          className="hero-background object-cover"
          style={{ opacity: bgOpacity }}
        />
      ) : (
        <div 
          className="hero-background"
          style={{ 
            backgroundImage: bgImage ? `url("${bgImage}")` : 'none',
            opacity: bgOpacity
          }}
        />
      )}
      <div className="hero-overlay" />

      {/* Main Container */}
      <main className="main-container">
        
        {/* Navigation Arrows */}
        <button className="nav-arrow nav-left" onClick={handlePrevImage}>
          <ChevronLeft size={24} />
        </button>
        <button className="nav-arrow nav-right" onClick={handleNextImage}>
          <ChevronRight size={24} />
        </button>

        {/* Top Left Logo */}
        <header className="header">
          <a href="#" className="logo">
            <img 
              src="/logo.svg" 
              alt="Invest Georgia UAE Logo" 
              className="main-logo" 
              width="200" 
              height="60"
            />
          </a>
        </header>

        {/* Top Right: Active Project Name */}
        <div className="top-right-header">
          <div 
            className="hero-project-name"
            style={{ opacity: imageNameOpacity }}
          >
            {activeProject.name}
          </div>
        </div>

        {/* Bottom Layout Wrapper */}
        <div className="bottom-wrapper" ref={bottomWrapperRef}>

          {/* Left Column: VR QR Code + Property Details Card */}
          <div className="left-details-column">
            
            {/* VR 3D QR Code Card (Positioned Above Details Card) */}
            {isVRProject && (
              <div className="vr-qr-card" title="Scan to bring the project to life">
                <div className="vr-qr-code-wrapper">
                  {(activeProject.name.toLowerCase().includes('ortachal') || (activeProject as any)?.slug?.toLowerCase()?.includes('ortachal')) ? (
                    <img 
                      src="/media/qr/ortachala-vr-qr.png" 
                      alt="Ortachala VR 3D QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src="/media/qr/kavtaradze-vr-qr.png" 
                      alt="Kavtaradze VR 3D QR Code"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="vr-qr-text-group">
                  <span className="vr-qr-title">
                    Scan to bring the<br />project to life
                  </span>
                </div>
              </div>
            )}

            {/* Property Details Card */}
            <section className="property-details-card">
              <h2 className="prop-title">{activeProject.name}</h2>

              <div className="details-grid">
                <div className="detail-item">
                  <CircleDollarSign className="detail-icon" />
                  <span className="detail-label">Starting Price:</span>
                  <span className="detail-value highlight">{activeProject.startingPrice}</span>
                </div>

                <div className="detail-item">
                  <Home className="detail-icon" />
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{activeProject.type}</span>
                </div>

                <div className="detail-item">
                  <Calendar className="detail-icon" />
                  <span className="detail-label">Payment Plan:</span>
                  <span className="detail-value highlight">{activeProject.paymentPlan}</span>
                </div>

                <div className="detail-item">
                  <Maximize className="detail-icon" />
                  <span className="detail-label">Size:</span>
                  <span className="detail-value">{activeProject.size}</span>
                </div>

                <div className="detail-item">
                  <TrendingUp className="detail-icon" />
                  <span className="detail-label">ROI:</span>
                  <span className="detail-value">
                    {activeProject.roi?.includes('%') ? activeProject.roi : `${activeProject.roi}%`}
                  </span>
                </div>

                <div className="detail-item">
                  <Clock className="detail-icon" />
                  <span className="detail-label">Completion:</span>
                  <span className="detail-value">{activeProject.completion}</span>
                </div>
              </div>

              {/* Inquiry / WhatsApp CTA */}
              {(() => {
                const phone = salesperson?.phone || salesperson?.whatsappPhone || '+995599000000'
                const cleanPhone = phone.replace(/[^\d+]/g, '')
                const message = encodeURIComponent(
                  `Hello ${salesperson?.name || 'Invest Georgia Team'}, I am interested in ${activeProject.name} (${activeProject.type}, Starting Price: ${activeProject.startingPrice}).`
                )
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`

                const handleContact = async (e: React.MouseEvent) => {
                  e.preventDefault()
                  if (salesperson?.id) {
                    // Agent Referral Link active! Open WhatsApp directly with tracking
                    try {
                      const res = await fetch('/api/tracking/whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          salespersonId: salesperson.id,
                          projectName: activeProject.name,
                          source: 'iigprojects_card'
                        })
                      })
                      const data = await res.json()
                      window.open(data.url || whatsappUrl, '_blank')
                    } catch {
                      window.open(whatsappUrl, '_blank')
                    }
                  } else {
                    // Direct visitor without referral link! Open IPS Contact Form Modal
                    setSubmitSuccess(false)
                    setIsInquiryOpen(true)
                  }
                }

                return (
                  <button
                    onClick={handleContact}
                    className="contact-btn"
                  >
                    Contact Now
                  </button>
                )
              })()}

            </section>
          </div>

          {/* Right Side: Projects Carousel */}
          <section className="projects-section">
            <div className="projects-header">
              <h3 className="section-title">Projects</h3>
              <div className="projects-header-actions">
                <button 
                  className="ui-toggle-btn"
                  onClick={() => setIsUIHidden(!isUIHidden)}
                  title={isUIHidden ? "Show Thumbnails" : "Hide Thumbnails"}
                >
                  {isUIHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{isUIHidden ? "Show Thumbnails" : "Hide Thumbnails"}</span>
                </button>
                <div className="carousel-nav">
                  <button className="carousel-nav-btn" onClick={() => scrollCarousel('left')}>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="carousel-nav-btn" onClick={() => scrollCarousel('right')}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div 
              className={`carousel-container ${isUIHidden ? 'ui-hidden' : ''}`}
              ref={carouselContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeaveOrUp}
              onMouseUp={handleMouseLeaveOrUp}
              onMouseMove={handleMouseMove}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleMouseLeaveOrUp}
              onTouchMove={handleTouchMove}
            >
              <div className="carousel-track">
                {projectsList.map(project => (
                  <div 
                    key={project.id}
                    className="carousel-item-wrapper"
                    onClick={() => {
                      if (!isDragOccurring.current) {
                        selectProject(project.id)
                      }
                    }}
                  >
                    <span className="carousel-label">{project.name}</span>
                    <div className={`carousel-item ${project.id === activeProjectId ? 'active' : ''}`}>
                      <img 
                        src={project.thumbnail ? (project.thumbnail.startsWith('/') ? project.thumbnail : `/${project.thumbnail}`) : (project.images[0] ? (project.images[0].startsWith('/') ? project.images[0] : `/${project.images[0]}`) : '')} 
                        alt={project.name}
                        width={200}
                        height={112}
                        loading={project.id === activeProjectId ? 'eager' : 'lazy'}
                        onError={(e) => {
                          const firstImg = project.images?.[0]
                          if (firstImg) {
                            const formatted = firstImg.startsWith('/') ? firstImg : `/${firstImg}`
                            if (!e.currentTarget.src.endsWith(formatted)) {
                              e.currentTarget.src = formatted
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* IPS Registration Form Modal Popup (For visitors without agent referral link) */}
      {isInquiryOpen && !showOtpModal && (
        <div className="ips-modal-overlay">
          <div className="ips-modal-card">
            {/* Close Button */}
            <button
              onClick={() => setIsInquiryOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-2 cursor-pointer z-10"
              style={{ background: 'transparent', border: 'none' }}
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5 shadow-xs" style={{ margin: '0 auto 20px auto' }}>
                  <UserCheck className="w-8 h-8" />
                </div>
                
                <h2 className={`${cormorant.className} text-3xl font-bold text-slate-900 mb-3 tracking-wide`} style={{ fontSize: '24px', margin: '0 0 12px 0' }}>
                  Registration Received
                </h2>
                
                <p className="text-slate-600 text-xs sm:text-sm max-w-sm leading-relaxed font-normal mb-6" style={{ fontSize: '13px', color: '#475569', margin: '0 0 20px 0' }}>
                  Thank you for registering with <strong>Invest Georgia UAE</strong>. Our team will get in touch with you shortly.
                </p>

                <div className="flex gap-3" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false)
                      setIsEmailVerified(false)
                    }}
                    className="role-btn active"
                    style={{ height: '40px', padding: '0 18px' }}
                  >
                    Submit Another
                  </button>
                  <button
                    onClick={() => setIsInquiryOpen(false)}
                    className="role-btn"
                    style={{ height: '40px', padding: '0 18px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {/* Form Header */}
                <div style={{ marginBottom: '18px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ca2d39', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Invest Georgia UAE
                  </span>
                  <h2 className={`${cormorant.className}`} style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Register Your Interest
                  </h2>
                  {activeProject && (
                    <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                      Inquiring about: <strong style={{ color: '#0f172a' }}>{activeProject.name}</strong>
                    </p>
                  )}
                </div>

                {/* Form Error Alert Banner */}
                {formError && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle style={{ color: '#dc2626', width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleFinalSubmit}>
                  
                  {/* Name Input */}
                  <div className="form-row">
                    <label htmlFor="modal-name">
                      Full Name <span style={{ color: '#94a3b8' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="modal-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Email Input with Inline Verification */}
                  <div className="form-row">
                    <label htmlFor="modal-email">
                      Email Address <span style={{ color: '#94a3b8' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="email"
                        id="modal-email"
                        value={formEmail}
                        onChange={(e) => {
                          setFormEmail(e.target.value)
                          setIsEmailVerified(false)
                        }}
                        placeholder="name@domain.com"
                        disabled={isSubmitting}
                        style={{ flex: 1, minWidth: 0 }}
                        required
                      />
                      {isEmailVerified ? (
                        <div style={{ flexShrink: 0, height: '44px', padding: '0 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontWeight: 600, fontSize: '11px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyEmailClick}
                          disabled={isSendingOtp || !formEmail.trim()}
                          style={{ flexShrink: 0, height: '44px', padding: '0 14px', borderRadius: '12px', background: '#0f172a', color: '#ffffff', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: 'none' }}
                        >
                          {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#ca2d39]" />}
                          <span>Verify Email</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phone / WhatsApp Input */}
                  <div className="form-row">
                    <label htmlFor="modal-phone">
                      Phone / WhatsApp Number <span style={{ color: '#94a3b8' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '110px', flexShrink: 0 }}>
                        <SearchableDropdown
                          items={COUNTRY_LIST}
                          value={formCountryCode}
                          onChange={(item) => setFormCountryCode(item.code)}
                          placeholder="+971"
                          displayFormat={(item) => `${item.flag} ${item.code}`}
                          matchKey="code"
                          disabled={isSubmitting}
                        />
                      </div>
                      <input
                        type="tel"
                        id="modal-phone"
                        pattern="[0-9]*"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="50 123 4567"
                        disabled={isSubmitting}
                        style={{ flex: 1, minWidth: 0 }}
                        required
                      />
                    </div>
                  </div>

                  {/* Preferred Mode of Contact Dropdown */}
                  <div className="form-row">
                    <label htmlFor="modal-preferredContactMode">
                      Preferred Mode of Contact <span style={{ color: '#94a3b8' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <select
                        id="modal-preferredContactMode"
                        value={formPreferredContactMode}
                        onChange={(e) => setFormPreferredContactMode(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                      </select>
                      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '10px' }}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Preferred Language Dropdown */}
                  <div className="form-row">
                    <label htmlFor="modal-language">
                      Preferred Language <span style={{ color: '#94a3b8' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <select
                        id="modal-language"
                        value={formLanguage}
                        onChange={(e) => setFormLanguage(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Other">Other</option>
                      </select>
                      <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: '10px' }}>
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="form-row" style={{ marginTop: '2px' }}>
                    <label>
                      I am a: <span style={{ color: '#94a3b8' }}>*</span>
                    </label>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                      {/* Investor Option */}
                      <button
                        type="button"
                        onClick={() => setFormRole('investor')}
                        disabled={isSubmitting}
                        className={`role-btn ${formRole === 'investor' ? 'active' : ''}`}
                      >
                        <span>Investor</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: formRole === 'investor' ? '1px solid #ca2d39' : '1px solid #cbd5e1', background: formRole === 'investor' ? '#ca2d39' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {formRole === 'investor' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', margin: 'auto' }} />}
                        </div>
                      </button>

                      {/* Broker Option */}
                      <button
                        type="button"
                        onClick={() => setFormRole('broker')}
                        disabled={isSubmitting}
                        className={`role-btn ${formRole === 'broker' ? 'active' : ''}`}
                      >
                        <span>Broker / Agent</span>
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: formRole === 'broker' ? '1px solid #ca2d39' : '1px solid #cbd5e1', background: formRole === 'broker' ? '#ca2d39' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {formRole === 'broker' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', margin: 'auto' }} />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isEmailVerified}
                    className="submit-btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Registration...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMAIL OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="ips-otp-overlay">
          <div className="ips-otp-card">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-2 cursor-pointer"
              style={{ background: 'transparent', border: 'none' }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl border bg-slate-50 border-slate-200 text-[#ca2d39] flex items-center justify-center mb-3 shadow-xs" style={{ margin: '0 auto 12px auto' }}>
                <Mail className="w-7 h-7" />
              </div>

              <span className="text-[10px] uppercase tracking-widest text-[#ca2d39] font-bold mb-1 block" style={{ marginBottom: '4px' }}>
                Invest Georgia UAE
              </span>

              <h3 className={`${cormorant.className} text-2xl font-bold text-slate-900 mb-2`} style={{ fontSize: '22px', margin: '0 0 8px 0' }}>
                Email Verification Code
              </h3>

              <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-xs mb-6" style={{ fontSize: '13px', margin: '0 0 20px 0' }}>
                Enter the 4-digit code sent to your email address <strong style={{ color: '#0f172a' }}>{formEmail}</strong>
              </p>

              <div className="flex gap-3 justify-center mb-6" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }} onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={isVerifyingOtp || isSendingOtp}
                    style={{ width: '48px', height: '56px', textAlign: 'center', fontSize: '20px', fontWeight: 700, color: '#0f172a', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', outline: 'none' }}
                  />
                ))}
              </div>

              {failedAttempts > 0 && (
                <div style={{ backgroundColor: '#fffbebeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '12px', padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>
                  ⚠️ {5 - failedAttempts} attempt{5 - failedAttempts === 1 ? '' : 's'} remaining.
                </div>
              )}

              <button
                type="button"
                onClick={() => verifyOtpCode()}
                disabled={isVerifyingOtp || isSendingOtp || otpDigits.some(d => d === '')}
                className="submit-btn-primary"
                style={{ marginTop: '0', marginBottom: '16px' }}
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Email Address</span>
                  </>
                )}
              </button>

              <div className="flex flex-col gap-2 items-center text-xs text-slate-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => sendOtpCode()}
                    disabled={isSendingOtp}
                    style={{ color: '#0f172a', background: 'transparent', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#ca2d39]" /> Resend Code
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Resend code in {resendTimer}s</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
