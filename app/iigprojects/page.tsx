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
  CheckCircle2
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
        className="w-full text-left bg-slate-50 hover:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none flex justify-between items-center cursor-pointer select-none"
      >
        <span className="truncate">
          {selectedItem ? displayFormat(selectedItem) : placeholder}
        </span>
        <span className="text-slate-400 text-xs ml-1">▼</span>
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

    if (!formName.trim()) {
      toast.error('Please enter your full name')
      return
    }

    const emailCheck = validateEmail(formEmail)
    if (!emailCheck.valid) {
      toast.error(emailCheck.error || 'Please enter a valid email address')
      return
    }

    if (!formPhone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    if (!isEmailVerified) {
      toast.error('Please click "Verify Email" to verify your email address before submitting.')
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
          role: formRole
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      toast.success(data.message || 'Registration successful!')
      setSubmitSuccess(true)

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
      toast.error(error.message || 'Failed to submit registration')
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

      if (urlsToPreload.length === 0) {
        if (isMounted) {
          setLoadProgress(100)
          setTimeout(() => setIsInitialLoading(false), 300)
        }
        return
      }

      let loadedCount = 0
      const totalCount = urlsToPreload.length

      const updateProgress = () => {
        loadedCount++
        const percentage = Math.min(Math.round((loadedCount / totalCount) * 100), 100)
        if (isMounted) setLoadProgress(percentage)

        if (loadedCount >= totalCount) {
          setTimeout(() => {
            if (isMounted) setIsInitialLoading(false)
          }, 300)
        }
      }

      urlsToPreload.forEach(url => {
        const img = new Image()
        img.onload = updateProgress
        img.onerror = updateProgress
        img.src = url
      })

      setTimeout(() => {
        if (isMounted) {
          setLoadProgress(100)
          setTimeout(() => setIsInitialLoading(false), 200)
        }
      }, 3500)
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
              className="w-48 h-auto mb-8 animate-pulse"
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
          className="hero-bg object-cover"
          style={{ opacity: bgOpacity }}
        />
      ) : (
        <div 
          className="hero-bg"
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
      {isInquiryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 sm:p-8 my-8 text-slate-900">
            {/* Close Button */}
            <button
              onClick={() => setIsInquiryOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-2 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5 shadow-xs">
                  <UserCheck className="w-8 h-8" />
                </div>
                
                <h2 className={`${cormorant.className} text-3xl font-bold text-slate-900 mb-3 tracking-wide`}>
                  Registration Received
                </h2>
                
                <p className="text-slate-600 text-xs sm:text-sm max-w-sm leading-relaxed font-normal mb-6">
                  Thank you for registering with <strong>Invest Georgia UAE</strong>. Our team will get in touch with you shortly.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSubmitSuccess(false)
                      setIsEmailVerified(false)
                    }}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm cursor-pointer"
                  >
                    Submit Another
                  </button>
                  <button
                    onClick={() => setIsInquiryOpen(false)}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {/* Form Header */}
                <div className="mb-5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#ca2d39] font-bold mb-1 block">
                    Invest Georgia UAE
                  </span>
                  <h2 className={`${cormorant.className} text-2xl sm:text-3xl font-bold tracking-wide text-slate-900`}>
                    Register Your Interest
                  </h2>
                  {activeProject && (
                    <p className="text-slate-500 text-xs mt-1">
                      Inquiring about: <strong className="text-slate-800">{activeProject.name}</strong>
                    </p>
                  )}
                </div>

                {/* Form Fields */}
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label htmlFor="modal-name" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Full Name <span className="text-slate-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="modal-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none placeholder-slate-400"
                      required
                    />
                  </div>

                  {/* Email Input with Inline Verification */}
                  <div className="space-y-1">
                    <label htmlFor="modal-email" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Email Address <span className="text-slate-400">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
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
                        className="flex-1 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none placeholder-slate-400 min-w-0"
                        required
                      />
                      {isEmailVerified ? (
                        <div className="shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyEmailClick}
                          disabled={isSendingOtp || !formEmail.trim()}
                          className="shrink-0 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#ca2d39]" />}
                          <span>Verify Email</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phone / WhatsApp Input */}
                  <div className="space-y-1">
                    <label htmlFor="modal-phone" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Phone / WhatsApp Number <span className="text-slate-400">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="w-[105px] shrink-0">
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
                        className="flex-1 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none placeholder-slate-400 min-w-0"
                        required
                      />
                    </div>
                  </div>

                  {/* Preferred Mode of Contact Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="modal-preferredContactMode" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Preferred Mode of Contact <span className="text-slate-400">*</span>
                    </label>
                    <div className="relative w-full">
                      <select
                        id="modal-preferredContactMode"
                        value={formPreferredContactMode}
                        onChange={(e) => setFormPreferredContactMode(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none appearance-none cursor-pointer"
                      >
                        <option value="WhatsApp" className="bg-white text-slate-900">WhatsApp</option>
                        <option value="Call" className="bg-white text-slate-900">Call</option>
                        <option value="Email" className="bg-white text-slate-900">Email</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Preferred Language Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="modal-language" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Preferred Language <span className="text-slate-400">*</span>
                    </label>
                    <div className="relative w-full">
                      <select
                        id="modal-language"
                        value={formLanguage}
                        onChange={(e) => setFormLanguage(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none appearance-none cursor-pointer"
                      >
                        <option value="English" className="bg-white text-slate-900">English</option>
                        <option value="Arabic" className="bg-white text-slate-900">Arabic</option>
                        <option value="Hindi" className="bg-white text-slate-900">Hindi</option>
                        <option value="Other" className="bg-white text-slate-900">Other</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2 pt-1">
                    <label className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      I am a: <span className="text-slate-400">*</span>
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Investor Option */}
                      <button
                        type="button"
                        onClick={() => setFormRole('investor')}
                        disabled={isSubmitting}
                        className={`relative py-2.5 px-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          formRole === 'investor'
                            ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider">Investor</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          formRole === 'investor' ? 'border-[#ca2d39] bg-[#ca2d39]' : 'border-slate-300 bg-white'
                        }`}>
                          {formRole === 'investor' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>

                      {/* Broker Option */}
                      <button
                        type="button"
                        onClick={() => setFormRole('broker')}
                        disabled={isSubmitting}
                        className={`relative py-2.5 px-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          formRole === 'broker'
                            ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider truncate">Broker / Agent</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          formRole === 'broker' ? 'border-[#ca2d39] bg-[#ca2d39]' : 'border-slate-300 bg-white'
                        }`}>
                          {formRole === 'broker' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full mt-4 inline-flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all ${
                      isEmailVerified
                        ? 'bg-[#ca2d39] hover:bg-[#b02530] text-white cursor-pointer shadow-md'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
                    }`}
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
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-900">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl border bg-slate-50 border-slate-200 text-[#ca2d39] flex items-center justify-center mb-3 shadow-xs">
                <Mail className="w-7 h-7" />
              </div>

              <span className="text-[10px] uppercase tracking-widest text-[#ca2d39] font-bold mb-1">
                Invest Georgia UAE
              </span>

              <h3 className={`${cormorant.className} text-2xl font-bold text-slate-900 mb-2`}>
                Email Verification Code
              </h3>

              <p className="text-slate-600 text-xs sm:text-sm font-normal max-w-xs mb-6">
                Enter the 4-digit code sent to your email address <span className="font-bold text-slate-900">{formEmail}</span>
              </p>

              <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
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
                    className="w-12 h-14 text-center text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-zinc-500 rounded-xl outline-none transition-colors shadow-xs"
                  />
                ))}
              </div>

              {failedAttempts > 0 && (
                <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 rounded-xl py-2 px-3 text-xs mb-4 text-center font-medium">
                  ⚠️ {5 - failedAttempts} attempt{5 - failedAttempts === 1 ? '' : 's'} remaining.
                </div>
              )}

              <button
                type="button"
                onClick={() => verifyOtpCode()}
                disabled={isVerifyingOtp || isSendingOtp || otpDigits.some(d => d === '')}
                className="w-full py-3 bg-[#ca2d39] hover:bg-[#b02530] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer shadow-md"
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
                    className="text-slate-900 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#ca2d39]" /> Resend Code
                  </button>
                ) : (
                  <span>Resend code in {resendTimer}s</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
