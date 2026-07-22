'use client'

import { useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Save, Lock, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { apiPut } from '@/lib/api'

export default function AdminProfilePage() {
  const { user, token } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  })

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSave = async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await apiPut('/profile', form, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      await apiPut('/profile/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token)
      setSaved(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <DashboardHeader title="Profile" description="Manage your personal account information" />

      <div className="max-w-2xl">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          {(['profile', 'password'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(null); setSaved(false) }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              {tab === 'profile' ? <User className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {tab === 'profile' ? 'Profile Info' : 'Change Password'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700"
          >
            Saved successfully!
          </motion.div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 shadow-sm"
        >
          {activeTab === 'profile' ? (
            <>
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 text-slate-900 font-bold text-2xl flex items-center justify-center shadow">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">{user?.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{user?.role} · {user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Full Name', key: 'name', type: 'text' },
                  { label: 'Email Address', key: 'email', type: 'email' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                  { label: 'Department', key: 'department', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground mb-4">Change Password</h2>
              {[
                { label: 'Current Password', key: 'currentPassword' },
                { label: 'New Password', key: 'newPassword' },
                { label: 'Confirm New Password', key: 'confirmPassword' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                  <input
                    type="password"
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePasswordChange}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                <Lock className="w-4 h-4" />
                {saving ? 'Updating...' : 'Update Password'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
