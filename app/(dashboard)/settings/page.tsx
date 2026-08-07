'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UserCircle, Building2, Key, Loader2 } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const { user, hasPermission, isLoading: permissionsLoading } = usePermissions()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'company'>('profile')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('Settings', 'VIEW')) {
      router.push('/dashboard')
    }
  }, [permissionsLoading, hasPermission, router])

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  if (permissionsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (!hasPermission('Settings', 'VIEW')) {
    return null
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      toast.error('Name and email are required')
      return
    }
    if (!user?.id) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/cms/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: user.phone || '' })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update profile')
      }
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      toast.error('Please enter your current and new password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Settings</h1>
        <p className="text-neutral-500 mt-2">Manage your account settings and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <UserCircle className={`w-5 h-5 ${activeTab === 'profile' ? 'text-neutral-500' : 'text-neutral-400'}`} />
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'security' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <Key className={`w-5 h-5 ${activeTab === 'security' ? 'text-neutral-500' : 'text-neutral-400'}`} />
            Security & Password
          </button>
          <button 
            onClick={() => setActiveTab('company')}
            className={`w-full flex items-center gap-3 px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'company' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <Building2 className={`w-5 h-5 ${activeTab === 'company' ? 'text-neutral-500' : 'text-neutral-400'}`} />
            Company
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword}>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password for enhanced security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password *</Label>
                    <Input 
                      id="currentPassword" 
                      type="password" 
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password *</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isChangingPassword} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                    {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}

          {activeTab === 'company' && (
            <form onSubmit={handleSaveProfile}>
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                  <CardDescription>Update your company information and branding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="Invest Georgia" defaultValue="Invest Georgia" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <Input id="website" type="url" placeholder="https://www.investingeorgia.ae" defaultValue="https://www.investingeorgia.ae" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="Company Address" defaultValue="Dubai, UAE" />
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
