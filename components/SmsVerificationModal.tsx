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

  const isFormComplete = digits.every(d => d !== '')

  return (
    <div 
      className="ips-otp-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200000,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="ips-otp-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          margin: 'auto',
          textAlign: 'center',
          boxSizing: 'border-box',
          zIndex: 200001
        }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>

        {/* Header Icon */}
        <div 
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: '#fff1f2',
            border: '1px solid #ffe4e6',
            color: '#ca2d39',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}
        >
          <Smartphone style={{ width: '28px', height: '28px' }} />
        </div>

        {/* Title */}
        <h3 
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 6px 0',
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.02em',
            textAlign: 'center'
          }}
        >
          Verify Phone Number
        </h3>

        {/* Subtitle */}
        <p 
          style={{
            fontSize: '13px',
            color: '#64748b',
            margin: '0 0 12px 0',
            fontWeight: 400,
            lineHeight: 1.4,
            textAlign: 'center'
          }}
        >
          We have sent a 6-digit SMS verification code.
        </p>

        {/* Phone Badge */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 14px',
            borderRadius: '20px',
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#ca2d39',
            fontFamily: 'monospace',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '24px'
          }}
        >
          {fullPhoneFormatted}
        </div>

        {devNotice && (
          <div 
            style={{
              padding: '10px 14px',
              backgroundColor: '#fffbebeb',
              border: '1px solid #fde68a',
              borderRadius: '12px',
              color: '#92400e',
              fontSize: '12px',
              fontWeight: 500,
              marginBottom: '18px',
              textAlign: 'center'
            }}
          >
            ⚡ {devNotice}
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div 
          onPaste={handlePaste}
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '24px'
          }}
        >
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
              style={{
                width: '46px',
                height: '52px',
                textAlign: 'center',
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: 'monospace',
                backgroundColor: digit ? '#fff5f5' : '#f8fafc',
                color: digit ? '#ca2d39' : '#0f172a',
                border: digit ? '2px solid #ca2d39' : '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                padding: 0
              }}
            />
          ))}
        </div>

        {/* Submit Action */}
        <button
          type="button"
          onClick={() => handleVerifySmsCode()}
          disabled={isVerifying || isSending || !isFormComplete}
          style={{
            width: '100%',
            height: '48px',
            backgroundColor: isFormComplete && !isVerifying && !isSending ? '#ca2d39' : '#e2e8f0',
            color: isFormComplete && !isVerifying && !isSending ? '#ffffff' : '#94a3b8',
            border: isFormComplete && !isVerifying && !isSending ? 'none' : '1px solid #cbd5e1',
            borderRadius: '14px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isFormComplete && !isVerifying && !isSending ? 'pointer' : 'not-allowed',
            margin: '0 0 16px 0',
            transition: 'all 0.15s ease'
          }}
        >
          {isVerifying ? (
            <>
              <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <ShieldCheck style={{ width: '16px', height: '16px', color: isFormComplete ? '#ffffff' : '#94a3b8' }} />
              <span>Verify & Confirm</span>
            </>
          )}
        </button>

        {/* Resend Cooldown */}
        <div style={{ textAlign: 'center' }}>
          {canResend ? (
            <button
              type="button"
              onClick={handleSendSmsCode}
              disabled={isSending}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '12px',
                color: '#ca2d39',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'underline'
              }}
            >
              {isSending ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <RefreshCw style={{ width: '14px', height: '14px' }} />}
              <span>Resend Code</span>
            </button>
          ) : (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Resend code in <strong style={{ color: '#ca2d39', fontFamily: 'monospace' }}>{resendTimer}s</strong>
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
