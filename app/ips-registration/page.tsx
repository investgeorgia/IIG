'use client'

import { useState, useRef, useEffect } from 'react'
import { Cormorant_Garamond } from 'next/font/google'
import { toast } from 'sonner'
import { Loader2, ArrowRight, UserCheck, Mail, RefreshCw, X, ShieldCheck, CheckCircle2, Sparkles, Smartphone } from 'lucide-react'
import SmsVerificationModal from '@/components/SmsVerificationModal'

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

// Custom Searchable Dropdown
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

export default function IpsRegistrationPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+971')
  const [phone, setPhone] = useState('')
  const [preferredContactMode, setPreferredContactMode] = useState('WhatsApp')
  const [language, setLanguage] = useState('English')
  const [role, setRole] = useState<'investor' | 'broker'>('investor')
  const [source, setSource] = useState<string>('website')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Capture lead source from URL query params or sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlSource = params.get('source') || params.get('utm_source')
      if (urlSource) {
        setSource(urlSource)
        try {
          sessionStorage.setItem('lead_source', urlSource)
        } catch (e) {
          console.warn('Could not store lead source in sessionStorage:', e)
        }
      } else {
        try {
          const storedSource = sessionStorage.getItem('lead_source')
          if (storedSource) {
            setSource(storedSource)
          }
        } catch (e) {
          console.warn('Could not read lead source from sessionStorage:', e)
        }
      }
    }
  }, [])

  // SMS Phone Verification State
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)

  const cleanPhoneDigits = phone.trim().replace(/^0+/, '')
  const fullPhone = `${countryCode} ${cleanPhoneDigits}`


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
      toast.error('Please verify your phone number before submitting.')
      setShowSmsModal(true)
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
          role,
          source
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 overflow-x-hidden font-sans px-4 py-8 md:px-12 lg:px-16">
      {/* Background Image - Fixed & Clearly Visible */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-40 z-0 scale-105"
        style={{ backgroundImage: `url('/batumi-bg.jpg')` }}
      />
      {/* Light Gradient Vignette Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-100/85 via-slate-50/75 to-slate-100/90 z-0 pointer-events-none" />

      {/* Main 12-Column Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6">
        
        {/* Right Column: Registration Form Panel (FIRST ON PHONE order-1, RIGHT ON DESKTOP lg:order-2 lg:col-span-5) */}
        <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-300/40 rounded-2xl p-6 sm:p-8">
            
            {success ? (
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

                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm cursor-pointer"
                >
                  Submit Another Form
                </button>
              </div>
            ) : (
              <div className="w-full">
                {/* Form Header */}
                <div className="mb-5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#ca2d39] font-bold mb-1 block">
                    IPS 2026 Registration
                  </span>
                  <h2 className={`${cormorant.className} text-2xl sm:text-3xl font-bold tracking-wide text-slate-900`}>
                    Register Your Interest
                  </h2>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  
                  {/* Name Input */}
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Full Name <span className="text-slate-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      disabled={isSubmitting}
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none placeholder-slate-400"
                      required
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Email Address <span className="text-slate-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      disabled={isSubmitting}
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none placeholder-slate-400"
                      required
                    />
                  </div>

                  {/* Phone / WhatsApp Input */}
                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Phone / WhatsApp Number <span className="text-slate-400">*</span>
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
                        className="flex-1 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 border border-slate-200 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-normal transition-colors outline-none placeholder-slate-400 min-w-0"
                        required
                      />
                      {isPhoneVerified ? (
                        <div className="shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs px-3 py-2.5 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!phone.trim()) {
                              toast.error('Please enter your phone number first')
                              return
                            }
                            setShowSmsModal(true)
                          }}
                          disabled={!phone.trim() || isSubmitting}
                          className="shrink-0 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-white" />
                          <span>Verify</span>
                        </button>
                      )}
                    </div>
                  </div>



                  {/* Preferred Mode of Contact Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="preferredContactMode" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Preferred Mode of Contact <span className="text-slate-400">*</span>
                    </label>
                    <div className="relative w-full">
                      <select
                        id="preferredContactMode"
                        value={preferredContactMode}
                        onChange={(e) => setPreferredContactMode(e.target.value)}
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
                    <label htmlFor="language" className="text-slate-700 text-[10px] font-bold uppercase tracking-wider block">
                      Preferred Language <span className="text-slate-400">*</span>
                    </label>
                    <div className="relative w-full">
                      <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
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
                        onClick={() => setRole('investor')}
                        disabled={isSubmitting}
                        className={`relative py-2.5 px-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          role === 'investor'
                            ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider">Investor</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          role === 'investor' ? 'border-[#ca2d39] bg-[#ca2d39]' : 'border-slate-300 bg-white'
                        }`}>
                          {role === 'investor' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>

                      {/* Broker Option */}
                      <button
                        type="button"
                        onClick={() => setRole('broker')}
                        disabled={isSubmitting}
                        className={`relative py-2.5 px-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          role === 'broker'
                            ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xs uppercase tracking-wider truncate">Broker / Agent</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          role === 'broker' ? 'border-[#ca2d39] bg-[#ca2d39]' : 'border-slate-300 bg-white'
                        }`}>
                          {role === 'broker' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 font-semibold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all bg-[#ca2d39] hover:bg-[#b02530] disabled:bg-slate-200 disabled:text-slate-400 text-white cursor-pointer shadow-md"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ca2d39]/10 border border-[#ca2d39]/30 text-[#ca2d39] text-xs uppercase tracking-widest font-bold w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invest Georgia UAE · IPS 2026</span>
          </div>

          <h1 className={`${cormorant.className} text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-wide text-slate-900`}>
            Invest Georgia UAE
          </h1>

          <p className="text-slate-700 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
            Join Invest Georgia UAE at the International Property Show (IPS 2026) in Dubai. Connect with top development teams, discover zero-tax property investments, and access exclusive developer rates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
            <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-md shadow-slate-200/50 text-xs backdrop-blur-md">
              <p className="font-bold text-[#ca2d39] text-sm mb-1">&lt;1% Tax</p>
              <p className="text-slate-600 text-[11px] font-medium">On Property</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-md shadow-slate-200/50 text-xs backdrop-blur-md">
              <p className="font-bold text-[#ca2d39] text-sm mb-1">Up to 18% ROI</p>
              <p className="text-slate-600 text-[11px] font-medium">Strong Rental Yields</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-md shadow-slate-200/50 text-xs backdrop-blur-md">
              <p className="font-bold text-[#ca2d39] text-sm mb-1">Direct Access</p>
              <p className="text-slate-600 text-[11px] font-medium">Exclusive IPS Offers</p>
            </div>
          </div>
        </div>

      </div>



      {/* Twilio SMS Verification Modal */}
      <SmsVerificationModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        countryCode={countryCode}
        phone={phone}
        onSuccess={() => setIsPhoneVerified(true)}
      />

    </div>
  )
}

