'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, UserCheck, UserX, Shield, Key, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { useRouter } from 'next/navigation'

function AccessModal({ user, onClose, queryClient }: any) {
  const modules = ['Amenities', 'Customers', 'Developers', 'Media', 'PaymentPlans', 'Projects', 'Settings', 'Templates', 'Units', 'Users']
  
  const { data: accessData = [], isLoading } = useQuery({
    queryKey: ['users', user.id, 'access'],
    queryFn: async () => {
      const res = await fetch(`/api/cms/users/${user.id}/access`)
      if (!res.ok) throw new Error('Failed to fetch access data')
      return res.json()
    }
  })

  const [overrides, setOverrides] = useState<any>({})

  useEffect(() => {
    if (Array.isArray(accessData) && accessData.length) {
      const init: any = {}
      accessData.forEach((a: any) => { init[a.moduleName] = a.accessLevel })
      setOverrides(init)
    }
  }, [accessData])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const overridesArray = Object.entries(overrides)
        .filter(([_, level]) => level !== 'DEFAULT')
        .map(([moduleName, accessLevel]) => ({ moduleName, accessLevel }))
      
      const res = await fetch(`/api/cms/users/${user.id}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: overridesArray })
      })
      if (!res.ok) throw new Error('Failed to save access')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', user.id, 'access'] })
      toast.success('Access updated')
      onClose()
    },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Access for {user.name}</h2>
          <p className="text-sm text-neutral-500">Overrides base role: {user.role?.name}</p>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
          ) : (
            <div className="space-y-3">
              {modules.map(mod => (
                <div key={mod} className="flex items-center justify-between">
                  <Label className="font-medium">{mod}</Label>
                  <select
                    className="flex h-9 w-32 rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={overrides[mod] || 'DEFAULT'}
                    onChange={e => setOverrides({ ...overrides, [mod]: e.target.value })}
                  >
                    <option value="DEFAULT">Default</option>
                    <option value="VIEW">View</option>
                    <option value="EDIT">Edit</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/cms/users/${user.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      toast.success(`Password updated for ${user.name}`)
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Change Password for {user.name}</h2>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>New Password *</Label>
            <Input 
              type="password" 
              placeholder="Minimum 6 characters" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <Label>Confirm New Password *</Label>
            <Input 
              type="password" 
              placeholder="Re-enter password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [passwordUser, setPasswordUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', roleId: '' })

  const openEdit = (user: any) => {
    setEditingUserId(user.id)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '', // Leave password blank on edits
      phone: user.phone || '',
      roleId: user.role?.id?.toString() || ''
    })
    setIsAdding(true)
  }

  useEffect(() => {
    if (!permissionsLoading && !hasPermission('Users', 'VIEW')) {
      router.push('/dashboard')
    }
  }, [permissionsLoading, hasPermission, router])

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/cms/users')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch users')
      }
      return res.json()
    },
    enabled: hasPermission('Users', 'VIEW')
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/cms/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      return res.json()
    },
    enabled: hasPermission('Users', 'EDIT')
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        roleId: Number(form.roleId),
        ...(!editingUserId ? { password: form.password } : {})
      }
      const url = editingUserId ? `/api/cms/users/${editingUserId}` : '/api/cms/users'
      const method = editingUserId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setForm({ name: '', email: '', password: '', phone: '', roleId: '' })
      setIsAdding(false)
      setEditingUserId(null)
      toast.success(editingUserId ? 'User updated successfully' : 'User created successfully')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/cms/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      if (!res.ok) throw new Error('Failed to update status')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/cms/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>
  
  if (!hasPermission('Users', 'VIEW')) {
    return null
  }

  const canEdit = hasPermission('Users', 'EDIT')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users & Access</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage team members, permissions, and passwords.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        )}
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">{editingUserId ? 'Edit User' : 'New User'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Full Name *</Label><Input placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email *</Label><Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              {!editingUserId && (
                <div className="space-y-1"><Label>Password *</Label><Input type="password" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              )}
              <div className="space-y-1"><Label>Phone</Label><Input placeholder="+1 234 567 890" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1 md:col-span-2"><Label>Role *</Label>
                <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                  <option value="">Select role...</option>
                  {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.email || (!form.password && !editingUserId) || !form.roleId || saveMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editingUserId ? 'Save Changes' : 'Create User'}
              </Button>
              <Button variant="outline" onClick={() => { setIsAdding(false); setEditingUserId(null); setForm({ name: '', email: '', password: '', phone: '', roleId: '' }) }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" /></div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900">{user.name}</td>
                    <td className="px-6 py-4 text-neutral-600">{user.email}</td>
                    <td className="px-6 py-4 text-neutral-500">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full font-medium">{user.role?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                      {canEdit ? (
                        <>
                          <Button variant="ghost" size="icon"
                            className="text-neutral-400 hover:text-blue-600"
                            title="Edit User Details"
                            onClick={() => openEdit(user)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            className="text-neutral-400 hover:text-amber-600"
                            title="Change Password"
                            onClick={() => setPasswordUser(user)}>
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            className="text-neutral-400 hover:text-blue-600"
                            title="Manage Access"
                            onClick={() => setSelectedUser(user)}>
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon"
                            className={`${user.isActive ? 'text-neutral-400 hover:text-red-600' : 'text-neutral-400 hover:text-green-600'}`}
                            title={user.isActive ? 'Disable User' : 'Enable User'}
                            onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}>
                            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          <Button variant="ghost" size="icon"
                            className="text-neutral-400 hover:text-red-600"
                            title="Delete User"
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently delete this user?')) {
                                deleteMutation.mutate(user.id)
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
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      
      {selectedUser && (
        <AccessModal 
          user={selectedUser} 
          queryClient={queryClient} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {passwordUser && (
        <ResetPasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
        />
      )}
    </div>
  )
}
