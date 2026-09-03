'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, X, ShieldCheck, Smartphone, RefreshCw } from 'lucide-react'

interface SmsVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  countryCode: string
  phone: string
  onSuccess: () => void
}

export default function SmsVerificationModal({
  isOpen,
  onClose,
  countryCode,
  phone,
  onSuccess
}: SmsVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [devNotice, setDevNotice] = useState<string | null>(null)

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const cleanDigits = phone.trim().replace(/^0+/, '').replace(/\s+/g, '')
  const fullPhoneFormatted = `${countryCode} ${cleanDigits}`

  // Trigger send SMS code on modal open
  useEffect(() => {
    if (isOpen && phone.trim()) {
      handleSendSmsCode()
    }
  }, [isOpen])

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen && resendTimer > 0) {
      setCanResend(false)
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
  }, [isOpen, resendTimer])

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs[0]?.current?.focus()
      }, 150)
    }
  }, [isOpen])

  const handleSendSmsCode = async () => {
    setIsSending(true)
    setDevNotice(null)
    try {
      const res = await fetch('/api/otp/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, phone })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send SMS verification code')
      }

      setResendTimer(60)
      setCanResend(false)
      setDigits(['', '', '', '', '', ''])

      if (data.devMode) {
        setDevNotice('Demo Mode: Test OTP code is 123456')
        toast.success('Test SMS Code: 123456 (Dev Mode)')
      } else {
        toast.success(data.message || `SMS verification code sent to ${fullPhoneFormatted}`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending SMS verification code')
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifySmsCode = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('')
    if (code.length < 4) {
      toast.error('Please enter the complete verification code')
      return
    }

    setIsVerifying(true)
    try {
      const res = await fetch('/api/otp/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, phone, code })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Please try again.')
      }

      toast.success('Phone number verified successfully!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'SMS verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = cleanVal
    setDigits(newDigits)

    if (cleanVal && index < 5) {
      inputRefs[index + 1]?.current?.focus()
    }

    // Auto submit if all 6 digits entered
    if (cleanVal && index === 5 && newDigits.every(d => d !== '')) {
      handleVerifySmsCode(newDigits.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pasted) {
      const pastedArr = pasted.split('')
      const newDigits = ['', '', '', '', '', '']
      pastedArr.forEach((d, i) => { if (i < 6) newDigits[i] = d })
      setDigits(newDigits)

      if (pastedArr.length === 6) {
        inputRefs[5]?.current?.focus()
        handleVerifySmsCode(pastedArr.join(''))
      } else if (pastedArr.length > 0) {
        inputRefs[Math.min(pastedArr.length, 5)]?.current?.focus()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-[#ca2d39] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Verify Phone Number
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto">
            We have sent a 6-digit SMS verification code.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[#ca2d39] font-mono text-sm font-bold mt-2">
            <span>{fullPhoneFormatted}</span>
          </div>
        </div>

        {devNotice && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs text-center font-medium">
            ⚡ {devNotice}
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying || isSending}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono bg-slate-50 border border-slate-200 focus:border-[#ca2d39] focus:ring-2 focus:ring-[#ca2d39]/20 text-slate-900 rounded-xl outline-none transition-all disabled:opacity-50 shadow-xs"
              />
            ))}
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={() => handleVerifySmsCode()}
            disabled={isVerifying || isSending || digits.some(d => d === '')}
            className="w-full bg-[#ca2d39] hover:bg-[#b02530] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Confirm</span>
              </>
            )}
          </button>

          {/* Resend Cooldown */}
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleSendSmsCode}
                disabled={isSending}
                className="text-xs text-slate-800 hover:text-[#ca2d39] font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:underline"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#ca2d39]" />}
                <span>Resend Code</span>
              </button>
            ) : (
              <p className="text-xs text-slate-500">
                Resend code in <span className="text-slate-800 font-mono font-semibold">{resendTimer}s</span>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
