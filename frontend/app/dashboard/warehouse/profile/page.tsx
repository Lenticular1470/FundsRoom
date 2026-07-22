'use client'

import { useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Save, Lock, User, Key, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { axiosClient } from '@/lib/axiosClient'

export default function WarehouseProfilePage() {
  const { user, token, logout } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  const [form, setForm] = useState({
    name: user?.name || 'Warehouse Operator',
    email: user?.email || 'bi@hji.com',
    phone: user?.phone || '+91 99887 76655',
    department: user?.department || 'Logistics & Dispatch',
  })

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await axiosClient.put('/profile', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await axiosClient.put('/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setSaved(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err?.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans">
      <DashboardHeader title="Profile & Account Settings" description="Manage your operator settings, email preferences, and password settings" />

      <div className="max-w-3xl grid grid-cols-1 lg:grid-cols-4 gap-6 items-start mt-6">
        {/* Navigation list */}
        <div className="lg:col-span-1 space-y-2 bg-[#0f1115]/90 border border-slate-800/60 p-4 rounded-2xl shadow-md">
          <button
            onClick={() => { setActiveTab('profile'); setError(null); setSaved(false) }}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'profile'
                ? 'bg-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <User className="w-4 h-4" /> Personal Details
          </button>
          <button
            onClick={() => { setActiveTab('password'); setError(null); setSaved(false) }}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'password'
                ? 'bg-amber-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Key className="w-4 h-4" /> Security & Password
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
          >
            <Lock className="w-4 h-4" /> Logout Session
          </button>
        </div>

        {/* Form area */}
        <div className="lg:col-span-3">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-950/20 border border-rose-500/30 p-4 text-xs text-rose-200">
              {error}
            </div>
          )}
          {saved && (
            <div className="mb-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 text-xs text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4" /> Changes saved successfully!
            </div>
          )}

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f1115]/90 border border-slate-800/60 p-6 rounded-2xl shadow-md"
          >
            {activeTab === 'profile' ? (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-800/40">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow">
                    {form.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg">{form.name}</h3>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-0.5">{user?.role || 'WAREHOUSE'} Operator</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Department</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/40">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-colors text-xs disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Operator Profile
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <h3 className="text-base font-bold text-white mb-4">Reset Operator Password</h3>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm font-semibold"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800/40">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-colors text-xs disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update Security Password
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
