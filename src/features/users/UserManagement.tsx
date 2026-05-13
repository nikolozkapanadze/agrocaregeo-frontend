import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/shared/stores'
import { users as usersApi } from '@/shared/lib/api'
import type { TenantUser } from '@/shared/lib/api'
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Check,
  Loader2,
  Shield,
  UserCheck,
  Eye,
} from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  admin: 'ადმინისტრატორი',
  agronomist: 'აგრონომი',
  viewer: 'დამკვირვებელი',
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'დამკვირვებელი' },
  { value: 'agronomist', label: 'აგრონომი' },
  { value: 'admin', label: 'ადმინისტრატორი' },
]

export default function UserManagement(): React.ReactElement {
  const { user: currentUser } = useAuthStore()
  const [userList, setUserList] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('viewer')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await usersApi.list()
      setUserList(data)
    } catch (err: any) {
      setError(err.message || 'მომხმარებლების ჩატვირთვა ვერ მოხდა')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError(null)
    try {
      await usersApi.create({ email, password, full_name: fullName, role })
      setShowForm(false)
      setEmail('')
      setPassword('')
      setFullName('')
      setRole('viewer')
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'მომხმარებლის დამატება ვერ მოხდა')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ მომხმარებლის დეაქტივაცია?')) return
    try {
      await usersApi.delete(id)
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'დეაქტივაცია ვერ მოხდა')
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <Shield className="h-12 w-12 mx-auto mb-4 text-text-muted opacity-40" />
        <h2 className="text-lg font-semibold text-text-primary">წვდომა აკრძალულია</h2>
        <p className="text-sm text-text-secondary mt-2">
          მომხმარებლების მართვა ხელმისაწვდომია მხოლოდ ადმინისტრატორისთვის
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">მომხმარებლები</h1>
          <p className="text-sm text-text-secondary mt-1">
            მართეთ თქვენი ორგანიზაციის მომხმარებლები
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-bg-primary text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'გაუქმება' : 'ახალი მომხმარებელი'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">ახალი მომხმარებლის დამატება</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">ელფოსტა</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="label">პაროლი</label>
              <input
                type="text"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="მინიმუმ 8 სიმბოლო"
              />
            </div>
            <div>
              <label className="label">სრული სახელი</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input w-full"
                placeholder="გიორგი გიორგაძე"
              />
            </div>
            <div>
              <label className="label">როლი</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input w-full"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={formLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                დამატება
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
          </div>
        ) : userList.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-text-secondary">მომხმარებლები არ მოიძებნა</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-text-muted text-xs">
                  <th className="text-left py-3 px-4">სახელი</th>
                  <th className="text-left py-3 px-4">ელფოსტა</th>
                  <th className="text-left py-3 px-4">როლი</th>
                  <th className="text-left py-3 px-4">სტატუსი</th>
                  <th className="text-right py-3 px-4">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] ${
                      u.id === currentUser?.id ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-text-primary font-medium">
                      <div className="flex items-center gap-2">
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">თქვენ</span>
                        )}
                        {u.full_name || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/5">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <UserCheck className="h-3 w-3" /> აქტიური
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Eye className="h-3 w-3" /> არააქტიური
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser?.id && u.is_active && (
                        <button
                          onClick={() => handleDeactivate(u.id)}
                          className="text-danger hover:text-danger/80 transition-colors"
                          title="დეაქტივაცია"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
