'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import Link from 'next/link'

export default function DevelopersPage() {
  const queryClient = useQueryClient()
  const { hasPermission, isLoading: permissionsLoading } = usePermissions()
  const [isAdding, setIsAdding] = useState(false)
  const [newDevName, setNewDevName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: developers, isLoading } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const res = await fetch('/api/cms/developers')
      if (!res.ok) throw new Error('Failed to fetch developers')
      return res.json()
    },
    enabled: hasPermission('Developers', 'VIEW')
  })

  const searchedDevelopers = developers
    ? developers.filter((d: any) => d.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/cms/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error('Failed to create developer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] })
      setIsAdding(false)
      setNewDevName('')
      toast.success('Developer created successfully')
    },
    onError: () => toast.error('Error creating developer')
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number, name: string }) => {
      const res = await fetch(`/api/cms/developers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error('Failed to update developer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] })
      setEditingId(null)
      toast.success('Developer updated successfully')
    },
    onError: () => toast.error('Error updating developer')
  })

  const startEditing = (dev: any) => {
    setEditingId(dev.id)
    setEditName(dev.name)
  }

  if (permissionsLoading) return <div className="p-8 text-center text-neutral-400">Loading...</div>
  
  if (!hasPermission('Developers', 'VIEW')) {
    return (
      <div className="p-8 text-center text-red-600 font-medium">
        You do not have permission to access Developers.
      </div>
    )
  }

  const canEdit = hasPermission('Developers', 'EDIT')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
        {canEdit && (
          <Button onClick={() => setIsAdding(!isAdding)} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> Add Developer
          </Button>
        )}
      </div>

      {isAdding && canEdit && (
        <Card className="shadow-sm border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">New Developer</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-4">
            <Input 
              placeholder="Developer Name" 
              value={newDevName} 
              onChange={(e) => setNewDevName(e.target.value)} 
              className="max-w-sm"
            />
            <Button 
              onClick={() => createMutation.mutate(newDevName)}
              disabled={!newDevName || createMutation.isPending}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 max-w-sm">
        <Input 
          placeholder="Search developers..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
        />
      </div>

      <Card className="shadow-sm border-neutral-200">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-neutral-500">Loading developers...</div>
          ) : searchedDevelopers?.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No developers found.</div>
          ) : (
             <table className="w-full text-sm text-left">
              <thead className="text-xs text-neutral-500 bg-neutral-50 border-b uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Added On</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedDevelopers?.map((dev: any) => (
                  <tr key={dev.id} className="bg-white border-b hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {editingId === dev.id ? (
                        <Input 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          className="max-w-[200px] h-8"
                          autoFocus
                        />
                      ) : (
                        <Link
                          href={`/cms/projects?developer=${dev.id}`}
                          className="text-red-600 hover:underline font-semibold"
                        >
                          {dev.name}
                        </Link>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">{new Date(dev.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      {editingId === dev.id ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => updateMutation.mutate({ id: dev.id, name: editName })}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startEditing(dev)} className="text-blue-600 hover:text-blue-700">
                                Edit
                              </Button>
                              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-neutral-400 text-xs">Read-only</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
