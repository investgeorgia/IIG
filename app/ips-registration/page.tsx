'use client'

import { useState, useRef, useEffect } from 'react'
import { Cormorant_Garamond } from 'next/font/google'
import { toast } from 'sonner'
import { Loader2, ArrowRight, UserCheck, MessageSquare, Mail, RefreshCw, X, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react'

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

// Strict email validator function to reject fake/spam patterns
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

// Custom Searchable Dropdown with clean UI
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
        className="w-full text-left bg-zinc-900/90 hover:bg-zinc-800/90 text-white border border-zinc-700/60 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-light transition-colors outline-none flex justify-between items-center cursor-pointer select-none"
      >
        <span className="truncate">
          {selectedItem ? displayFormat(selectedItem) : placeholder}
        </span>
        <span className="text-zinc-400 text-xs ml-1">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-950 border border-zinc-700/70 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-zinc-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-zinc-900 text-white border border-zinc-700/60 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-emerald-500/50 font-light"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
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
                    className="w-full text-left px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm shrink-0">{item.flag}</span>
                    <span className="truncate">{item.name}</span>
                    <span className="text-zinc-500 ml-auto shrink-0">{item.code}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-xs text-zinc-500 text-center">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function IpsRegistrationPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+971')
  const [phone, setPhone] = useState('')
  const [preferredContactMode, setPreferredContactMode] = useState('WhatsApp')
  const [language, setLanguage] = useState('English')
  const [role, setRole] = useState<'investor' | 'broker'>('investor')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Verification State
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  // OTP Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpChannel, setOtpChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP')
  const [otpDigits, setOtpDigits] = useState(['', '', '', ''])
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ]

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any
    if (showOtpModal && resendTimer > 0) {
      setCanResend(false)
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(timer)
  }, [showOtpModal, resendTimer])

  // Auto focus first OTP input when modal opens
  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus()
      }, 150)
    }
  }, [showOtpModal, otpChannel])

  const cleanPhoneDigits = phone.trim().replace(/^0+/, '')
  const fullPhone = `${countryCode} ${cleanPhoneDigits}`

  // Function to send OTP via API
  const sendOtpCode = async (channel: 'WHATSAPP' | 'EMAIL') => {
    setIsSendingOtp(true)
    const target = channel === 'WHATSAPP' ? fullPhone : email.trim()
    
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, channel })
      })

      const data = await res.json()

      // If WhatsApp failed or API returned fallbackToEmail, automatically switch to Email OTP
      if (!res.ok || data.fallbackToEmail) {
        if (channel === 'WHATSAPP') {
          toast.info(data.error || 'WhatsApp delivery unavailable. Switching to Email verification...')
          sendOtpCode('EMAIL')
          return
        }
        throw new Error(data.error || 'Failed to send verification code')
      }

      setOtpChannel(channel)
      setResendTimer(30)
      setCanResend(false)
      setOtpDigits(['', '', '', ''])
      
      toast.success(
        channel === 'WHATSAPP'
          ? 'Verification code sent to your WhatsApp!'
          : 'Verification code sent to your Email!'
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code')
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Handle clicking "Verify Phone" button inline
  const handleVerifyPhoneClick = () => {
    if (!name.trim()) {
      toast.error('Please enter your full name first')
      return
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      toast.error(emailCheck.error || 'Please enter a valid email address')
      return
    }

    if (!phone.trim() || phone.trim().length < 5) {
      toast.error('Please enter a valid phone number')
      return
    }

    setFailedAttempts(0)
    setShowOtpModal(true)
    sendOtpCode('WHATSAPP')
  }

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)

    if (digit && index < 3) {
      otpInputRefs[index + 1]?.current?.focus()
    }

    if (digit && index === 3 && newDigits.every(d => d !== '')) {
      verifyOtpCode(newDigits.join(''))
    }
  }

  // Handle paste in OTP inputs
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4)
    if (pastedData) {
      const digits = pastedData.split('').concat(['', '', '', '']).slice(0, 4)
      setOtpDigits(digits)
      digits.forEach((d, idx) => {
        if (otpInputRefs[idx]?.current) {
          otpInputRefs[idx]!.current!.value = d
        }
      })
      if (digits.every(d => d !== '')) {
        verifyOtpCode(digits.join(''))
      }
    }
  }

  // Handle Backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus()
    }
  }

  // Verify OTP code
  const verifyOtpCode = async (enteredCode?: string) => {
    const code = enteredCode || otpDigits.join('')
    if (code.length < 4) {
      toast.error('Please enter the full 4-digit code')
      return
    }

    setIsVerifyingOtp(true)
    const target = otpChannel === 'WHATSAPP' ? fullPhone : email.trim()

    try {
      const verifyRes = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, channel: otpChannel, code })
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        const attempts = (failedAttempts + 1)
        setFailedAttempts(attempts)
        
        if (verifyData.fallbackToEmail || attempts >= 3) {
          toast.warning('3 failed attempts on WhatsApp. Switching to Email verification.')
          setFailedAttempts(0)
          sendOtpCode('EMAIL')
          return
        }

        throw new Error(verifyData.error || 'Incorrect verification code')
      }

      // Verification Success!
      setIsPhoneVerified(true)
      setShowOtpModal(false)
      toast.success('Phone number verified successfully!')

    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Submit final registration form
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter your full name')
      return
    }

    const emailCheck = validateEmail(email)
    if (!emailCheck.valid) {
      toast.error(emailCheck.error || 'Please enter a valid email address')
      return
    }

    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    if (!isPhoneVerified) {
      toast.error('Please click "Verify Phone" to verify your number before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ips-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: fullPhone,
          preferredContactMode,
          language,
          role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      toast.success(data.message || 'Registration successful!')
      setSuccess(true)

      // Reset form
      setName('')
      setEmail('')
      setCountryCode('+971')
      setPhone('')
      setPreferredContactMode('WhatsApp')
      setLanguage('English')
      setRole('investor')
      setIsPhoneVerified(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 overflow-x-hidden font-sans px-4 py-8 md:px-12 lg:px-16">
      {/* Background Image - Fixed, Vivid & Clearly Visible */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-55 z-0 scale-105"
        style={{ backgroundImage: `url('/batumi-bg.jpg')` }}
      />
      {/* Gradient Vignette Overlay for Crisp Readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/55 to-zinc-950/80 z-0 pointer-events-none" />

      {/* Main 12-Column Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6">
        
        {/* Right Column: Registration Form Panel (FIRST ON PHONE order-1, RIGHT ON DESKTOP lg:order-2 lg:col-span-5) */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-zinc-950/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
            
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                  <UserCheck className="w-8 h-8" />
                </div>
                
                <h2 className={`${cormorant.className} text-3xl font-bold text-white mb-3 tracking-wide`}>
                  Registration Received
                </h2>
                
                <p className="text-zinc-300 text-xs sm:text-sm max-w-sm leading-relaxed font-light mb-6">
                  Thank you for registering with <strong>Invest Georgia UAE</strong>. Our team will get in touch with you shortly.
                </p>

                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  Submit Another Form
                </button>
              </div>
            ) : (
              <div className="w-full">
                {/* Form Header */}
                <div className="mb-5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-semibold mb-1 block">
                    IPS 2026 Registration
                  </span>
                  <h2 className={`${cormorant.className} text-2xl sm:text-3xl font-bold tracking-wide text-white`}>
                    Register Your Interest
                  </h2>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider block">
                      Full Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                      className="w-full bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-white border border-zinc-700/70 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-light transition-colors outline-none placeholder-zinc-500"
                      required
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider block">
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      disabled={isSubmitting}
                      className="w-full bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-white border border-zinc-700/70 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-light transition-colors outline-none placeholder-zinc-500"
                      required
                    />
                  </div>

                  {/* Phone / WhatsApp Input with Inline Verification */}
                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider block">
                      Phone / WhatsApp Number <span className="text-emerald-400">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="w-[105px] shrink-0">
                        <SearchableDropdown
                          items={COUNTRY_LIST}
                          value={countryCode}
                          onChange={(item) => {
                            setCountryCode(item.code)
                            setIsPhoneVerified(false)
                          }}
                          placeholder="+971"
                          displayFormat={(item) => `${item.flag} ${item.code}`}
                          matchKey="code"
                          disabled={isSubmitting}
                        />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        pattern="[0-9]*"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/[^0-9]/g, ''))
                          setIsPhoneVerified(false)
                        }}
                        placeholder="50 123 4567"
                        disabled={isSubmitting}
                        className="flex-1 bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-white border border-zinc-700/70 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-light transition-colors outline-none placeholder-zinc-500 min-w-0"
                        required
                      />
                      {isPhoneVerified ? (
                        <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyPhoneClick}
                          disabled={isSendingOtp || !phone.trim()}
                          className="shrink-0 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold text-xs px-3 py-2.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>Verify</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preferred Mode of Contact Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="preferredContactMode" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider block">
                      Preferred Mode of Contact <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative w-full">
                      <select
                        id="preferredContactMode"
                        value={preferredContactMode}
                        onChange={(e) => setPreferredContactMode(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-white border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-light transition-colors outline-none appearance-none cursor-pointer"
                      >
                        <option value="WhatsApp" className="bg-zinc-950 text-white">WhatsApp</option>
                        <option value="Call" className="bg-zinc-950 text-white">Call</option>
                        <option value="Email" className="bg-zinc-950 text-white">Email</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Preferred Language Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="language" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider block">
                      Preferred Language <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative w-full">
                      <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-zinc-900/90 hover:bg-zinc-900 focus:bg-zinc-900 text-white border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-light transition-colors outline-none appearance-none cursor-pointer"
                      >
                        <option value="English" className="bg-zinc-950 text-white">English</option>
                        <option value="Arabic" className="bg-zinc-950 text-white">Arabic</option>
                        <option value="Hindi" className="bg-zinc-950 text-white">Hindi</option>
                        <option value="Other" className="bg-zinc-950 text-white">Other</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2 pt-1">
                    <label className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider block">
                      I am a: <span className="text-emerald-400">*</span>
                    </label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Investor Option */}
                      <button
                        type="button"
                        onClick={() => setRole('investor')}
                        disabled={isSubmitting}
                        className={`relative py-2.5 px-3 rounded-xl border text-left transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                          role === 'investor'
                            ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                            : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider">Investor</span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          role === 'investor' ? 'border-white bg-white' : 'border-zinc-600'
                        }`}>
                          {role === 'investor' && <div className="w-1 h-1 rounded-full bg-black" />}
                        </div>
                      </button>

                      {/* Broker Option */}
                      <button
                        type="button"
                        onClick={() => setRole('broker')}
                        disabled={isSubmitting}
                        className={`relative py-2.5 px-3 rounded-xl border text-left transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                          role === 'broker'
                            ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                            : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider truncate">Broker / Agent</span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          role === 'broker' ? 'border-white bg-white' : 'border-zinc-600'
                        }`}>
                          {role === 'broker' && <div className="w-1 h-1 rounded-full bg-black" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full mt-4 inline-flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-colors ${
                      isPhoneVerified
                        ? 'bg-white text-black hover:bg-zinc-200 cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
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

        {/* Left Column: Event & Branding Hero Info (SECOND ON PHONE order-2, LEFT ON DESKTOP lg:order-1 lg:col-span-7) */}
        <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs uppercase tracking-widest font-medium w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invest Georgia UAE · IPS 2026</span>
          </div>

          <h1 className={`${cormorant.className} text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-wide text-white`}>
            Invest Georgia UAE
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base font-light leading-relaxed max-w-xl">
            Join Invest Georgia UAE at the International Property Show (IPS 2026) in Dubai. Connect with top development teams, discover zero-tax property investments, and access exclusive developer rates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-xs backdrop-blur-md">
              <p className="font-semibold text-emerald-400 text-sm mb-1">0% Tax</p>
              <p className="text-zinc-400 text-[11px] font-light">On Property Capital Gains</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-xs backdrop-blur-md">
              <p className="font-semibold text-emerald-400 text-sm mb-1">High ROI</p>
              <p className="text-zinc-400 text-[11px] font-light">Strong Rental Yields</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 text-xs backdrop-blur-md">
              <p className="font-semibold text-emerald-400 text-sm mb-1">Direct Access</p>
              <p className="text-zinc-400 text-[11px] font-light">Exclusive IPS Offers</p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── OTP VERIFICATION MODAL ─── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 ${
                otpChannel === 'WHATSAPP'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
                {otpChannel === 'WHATSAPP' ? (
                  <MessageSquare className="w-7 h-7" />
                ) : (
                  <Mail className="w-7 h-7" />
                )}
              </div>

              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1">
                Invest Georgia UAE
              </span>

              <h3 className={`${cormorant.className} text-2xl font-bold text-white mb-2`}>
                Verification Code
              </h3>

              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xs mb-6">
                {otpChannel === 'WHATSAPP' ? (
                  <>Enter the 4-digit code sent to your WhatsApp number <span className="font-semibold text-emerald-400">{fullPhone}</span></>
                ) : (
                  <>Enter the 4-digit code sent to your email address <span className="font-semibold text-blue-400">{email}</span></>
                )}
              </p>

              {/* 4-Digit Inputs */}
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
                    className="w-12 h-14 text-center text-xl font-bold text-white bg-zinc-900 border border-zinc-700 rounded-xl focus:border-emerald-400 outline-none transition-colors"
                  />
                ))}
              </div>

              {/* Remaining Attempts Warning */}
              {failedAttempts > 0 && otpChannel === 'WHATSAPP' && (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl py-2 px-3 text-xs mb-4 text-center">
                  ⚠️ {3 - failedAttempts} attempt{3 - failedAttempts === 1 ? '' : 's'} remaining on WhatsApp before switching to Email.
                </div>
              )}

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => verifyOtpCode()}
                disabled={isVerifyingOtp || isSendingOtp || otpDigits.some(d => d === '')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 mb-4 cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Phone Number</span>
                  </>
                )}
              </button>

              {/* Resend Footer */}
              <div className="flex flex-col gap-2 items-center text-xs text-zinc-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => sendOtpCode(otpChannel)}
                    disabled={isSendingOtp}
                    className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                  </button>
                ) : (
                  <span>Resend code in {resendTimer}s</span>
                )}

                {otpChannel === 'WHATSAPP' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFailedAttempts(0)
                      sendOtpCode('EMAIL')
                    }}
                    disabled={isSendingOtp}
                    className="text-zinc-400 hover:text-white underline mt-2 text-[11px] cursor-pointer"
                  >
                    Didn't receive WhatsApp code? Verify via Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
