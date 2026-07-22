'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Mail,
  Shield,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Save,
  Calendar,
  BadgeCheck,
} from 'lucide-react'
import axiosClient from '@/lib/axiosClient'
import { useAuth } from '@/lib/auth-context'

// ─── Schemas ────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(80),
  email: z.string().email('Enter a valid email'),
})

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'At least 1 uppercase letter')
      .regex(/[0-9]/, 'At least 1 number')
      .regex(/[^A-Za-z0-9]/, 'At least 1 special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

interface ToastState { type: 'success' | 'error'; message: string }

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function ProfileSettingsPage() {
  const { user: authUser, updateUser } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [showConfPw, setShowConfPw] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // ─── Fetch Profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await axiosClient.get('/profile')
        const p = res.data?.data || res.data
        setProfile(p)
        profileForm.reset({ name: p.name, email: p.email })
      } catch (err: any) {
        showToast('error', err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // ─── Update Profile ───────────────────────────────────────────────────────
  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const res = await axiosClient.put('/profile', data)
      const updated = res.data?.data || res.data
      setProfile(updated)
      // Sync auth context so sidebar/header reflects new name
      updateUser({ name: updated.name, email: updated.email })
      showToast('success', 'Profile updated successfully!')
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update profile.')
    }
  }

  // ─── Change Password ──────────────────────────────────────────────────────
  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await axiosClient.put('/profile', { password: data.password })
      passwordForm.reset({ password: '', confirmPassword: '' })
      showToast('success', 'Password changed successfully!')
    } catch (err: any) {
      showToast('error', err.message || 'Failed to change password.')
    }
  }

  const ROLE_BADGE: Record<string, string> = {
    ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    SALES: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    WAREHOUSE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    ACCOUNTS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-slate-400 text-sm">Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-200' : 'bg-red-950 border-red-800 text-red-200'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-400" />
          Profile & Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account details and security</p>
      </div>

      {/* Profile Card */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg flex flex-wrap items-center gap-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-900/30">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{profile.name}</h2>
            <p className="text-xs text-slate-400 truncate">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${ROLE_BADGE[profile.role] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                {profile.role}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="w-3 h-3" />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <BadgeCheck className="w-6 h-6 text-emerald-400 ml-auto flex-shrink-0" title="Verified account" />
        </motion.div>
      )}

      {/* Edit Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-lg"
      >
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-emerald-400" />
          Personal Information
        </h3>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                {...profileForm.register('name')}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            {profileForm.formState.errors.name && (
              <p className="text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                {...profileForm.register('email')}
                type="email"
                placeholder="your@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            {profileForm.formState.errors.email && (
              <p className="text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {profileForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Department Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                value={profile?.role || ''}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-400 cursor-not-allowed select-none"
              />
            </div>
            <p className="text-slate-500 mt-1">Role is assigned by an administrator and cannot be changed here.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 disabled:opacity-60 flex items-center gap-2 transition-all"
            >
              {profileForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>

      {/* Change Password Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-6 shadow-lg"
      >
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-emerald-400" />
          Change Password
        </h3>
        <p className="text-[11px] text-slate-400 mb-5">Choose a strong password with uppercase, number, and special character.</p>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">New Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                {...passwordForm.register('password')}
                type={showPw ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 upper, 1 number, 1 symbol"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.password && (
              <p className="text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                {...passwordForm.register('confirmPassword')}
                type={showConfPw ? 'text' : 'password'}
                placeholder="Repeat your new password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              <button type="button" onClick={() => setShowConfPw(p => !p)} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                {showConfPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-xs shadow-lg shadow-blue-900/30 disabled:opacity-60 flex items-center gap-2 transition-all"
            >
              {passwordForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
        className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg"
      >
        <h3 className="text-sm font-bold text-white mb-4">Account Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Account ID', value: profile?.id?.slice(0, 8) + '...' },
            { label: 'Member Since', value: profile ? new Date(profile.createdAt).toLocaleDateString('en-GB') : '—' },
            { label: 'Role', value: profile?.role },
          ].map((item) => (
            <div key={item.label} className="bg-slate-950/70 rounded-xl p-3 border border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium mb-0.5">{item.label}</p>
              <p className="text-xs text-white font-semibold font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
