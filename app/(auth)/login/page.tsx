'use client'

import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import Image from 'next/image'
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Invalid credentials')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Welcome back!')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row">

      {/* ── Left Panel: Georgia Image ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
        <Image
          src="/georgia-bg.jpg"
          alt="Tbilisi, Georgia"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top: Logo */}
          <div>
            <Image
              src="/logo-black.svg"
              alt="IIG Logo"
              width={140}
              height={45}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Bottom: Tagline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white/90 text-xs font-medium tracking-wide uppercase">Tbilisi, Georgia</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight max-w-sm">
              Your Gateway to<br />
              <span className="text-red-400">Georgian Real Estate</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Premium property investments in one of Europe&apos;s fastest-growing markets.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 pt-4">
              {[
                { value: '200+', label: 'Properties' },
                { value: '50+', label: 'Investors' },
                { value: '98%', label: 'Satisfaction' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/60 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col bg-[#fafafa] relative">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center pt-10 pb-2 relative z-10">
          <Image
            src="/logo-black.svg"
            alt="IIG Logo"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* Form centred */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-[400px] space-y-8">

            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-sm text-neutral-500">
                Access the CMS &amp; Proposal Platform
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-neutral-100 p-8 space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      autoComplete="email"
                      {...form.register('email')}
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-neutral-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                        ${form.formState.errors.email ? 'border-red-400' : 'border-neutral-200'}`}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...form.register('password')}
                      className={`w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border bg-neutral-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                        ${form.formState.errors.password ? 'border-red-400' : 'border-neutral-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors text-xs font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm shadow-red-200 transition-all duration-150 active:scale-[0.98] mt-2"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-neutral-400">
              © {new Date().getFullYear()} Investing Georgia. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
