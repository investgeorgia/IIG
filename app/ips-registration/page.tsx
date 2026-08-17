'use client'

import { useState, useRef, useEffect } from 'react'
import { Cormorant_Garamond } from 'next/font/google'
import { toast } from 'sonner'
import { Loader2, ArrowRight, UserCheck } from 'lucide-react'

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
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
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

// Custom Premium Searchable Dropdown with glassmorphism styles
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
        className="w-full text-left bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-sm font-light transition-all outline-none flex justify-between items-center cursor-pointer select-none"
      >
        <span className="truncate">
          {selectedItem ? displayFormat(selectedItem) : placeholder}
        </span>
        <span className="text-white/40 text-xs ml-2">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-neutral-950/90 backdrop-blur-2xl border border-white/[0.1] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-white/[0.05]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white/[0.05] text-white border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/20 font-light"
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                    className="w-full text-left px-4 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2"
                  >
                    <span className="text-sm shrink-0">{item.flag}</span>
                    <span className="truncate">{item.name}</span>
                    <span className="text-white/40 ml-auto shrink-0">{item.code}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-xs text-white/40 text-center">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!name.trim()) {
      toast.error('Please enter your full name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter your Phone / WhatsApp number')
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
          phone: `${countryCode} ${phone.trim()}`, 
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen md:h-screen w-full flex items-center justify-center bg-black overflow-hidden font-sans px-4 py-6 md:py-0 md:px-8">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-40 z-0 scale-105"
        style={{ backgroundImage: `url('/ips-bg.webp')` }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/55 z-0" />

      {/* Decorative Blob 1 */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      
      {/* Decorative Blob 2 */}
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none animate-pulse duration-[10000ms]" />

      {/* Glassmorphism Outer Panel */}
      <div className="relative z-10 w-full max-w-xl bg-white/[0.04] backdrop-blur-[24px] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-3xl p-6 md:p-8 transition-all duration-500 my-4 md:my-0">
        
        {success ? (
          <div className="flex flex-col items-center justify-center text-center py-10 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <UserCheck className="w-10 h-10" />
            </div>
            
            <h2 className={`${cormorant.className} text-4xl font-bold text-white mb-4 tracking-wide`}>
              Registration Received
            </h2>
            
            <p className="text-white/70 text-sm md:text-base max-w-md leading-relaxed font-light mb-8">
              Thank you for registering. Our team will get in touch with you shortly with matching opportunities.
            </p>

            <button
              onClick={() => setSuccess(false)}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 transform hover:scale-[1.02]"
            >
              Submit Another Form
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* Header */}
            <div className="text-center mb-5">
              <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-semibold mb-2 block">
                Exclusive Access
              </span>
              <h1 className={`${cormorant.className} text-3xl md:text-4xl font-bold leading-tight tracking-wide text-white`}>
                Explore Global Property Opportunities
              </h1>
              <p className="mt-2 text-white/70 text-xs md:text-sm font-light leading-relaxed max-w-md mx-auto">
                Tell us a little about yourself and what you’re looking for. Our team will get in touch with the right opportunities and information.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-white/80 text-[11px] font-semibold uppercase tracking-wider block">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-sm font-light transition-all outline-none placeholder-white/30 focus:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-white/80 text-[11px] font-semibold uppercase tracking-wider block">
                  Email Address <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-sm font-light transition-all outline-none placeholder-white/30 focus:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                  required
                />
              </div>

              {/* Phone / WhatsApp Input */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-white/80 text-[11px] font-semibold uppercase tracking-wider block">
                  Phone / WhatsApp Number <span className="text-emerald-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-[120px] shrink-0">
                    <SearchableDropdown
                      items={COUNTRY_LIST}
                      value={countryCode}
                      onChange={(item) => setCountryCode(item.code)}
                      placeholder="+971"
                      displayFormat={(item) => `${item.flag} ${item.code}`}
                      matchKey="code"
                      disabled={isSubmitting}
                    />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="50 123 4567"
                    disabled={isSubmitting}
                    className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-sm font-light transition-all outline-none placeholder-white/30 focus:shadow-[0_0_20px_rgba(255,255,255,0.03)]"
                    required
                  />
                </div>
              </div>

              {/* Preferred Mode of Contact Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="preferredContactMode" className="text-white/80 text-[11px] font-semibold uppercase tracking-wider block">
                  Preferred Mode of Contact <span className="text-emerald-400">*</span>
                </label>
                <div className="relative w-full">
                  <select
                    id="preferredContactMode"
                    value={preferredContactMode}
                    onChange={(e) => setPreferredContactMode(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-sm font-light transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="WhatsApp" className="bg-neutral-950 text-white">WhatsApp</option>
                    <option value="Call" className="bg-neutral-950 text-white">Call</option>
                    <option value="Email" className="bg-neutral-950 text-white">Email</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Preferred Language Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="language" className="text-white/80 text-[11px] font-semibold uppercase tracking-wider block">
                  Preferred Language <span className="text-emerald-400">*</span>
                </label>
                <div className="relative w-full">
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] text-white border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-3 text-sm font-light transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="English" className="bg-neutral-950 text-white">English</option>
                    <option value="Arabic" className="bg-neutral-950 text-white">Arabic</option>
                    <option value="Hindi" className="bg-neutral-950 text-white">Hindi</option>
                    <option value="Other" className="bg-neutral-950 text-white">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2.5">
                <label className="text-white/80 text-[11px] font-semibold uppercase tracking-wider block">
                  I am a: <span className="text-emerald-400">*</span>
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Investor Option */}
                  <button
                    type="button"
                    onClick={() => setRole('investor')}
                    disabled={isSubmitting}
                    className={`relative py-2.5 px-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      role === 'investor'
                        ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-white font-semibold'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-white/50 hover:text-white/70'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider">Investor</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      role === 'investor' ? 'border-white bg-white' : 'border-white/30'
                    }`}>
                      {role === 'investor' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>

                  {/* Broker Option */}
                  <button
                    type="button"
                    onClick={() => setRole('broker')}
                    disabled={isSubmitting}
                    className={`relative py-2.5 px-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between cursor-pointer ${
                      role === 'broker'
                        ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-white font-semibold'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-white/50 hover:text-white/70'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-wider truncate">Broker / Agent</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      role === 'broker' ? 'border-white bg-white' : 'border-white/30'
                    }`}>
                      {role === 'broker' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-100 disabled:bg-neutral-800 disabled:text-neutral-500 font-semibold text-xs tracking-wider uppercase py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Submission...</span>
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
  )
}
