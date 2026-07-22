'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  ShieldCheck,
  Building,
  Key,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'
import SalesHeader from '@/components/sales-header'

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  department?: string
  securityAccess?: string
  createdAt?: string
}

export default function SalesProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const response = await axiosClient.get('/profile')
        const data = response.data?.data || response.data
        setProfile(data)
      } catch (err: any) {
        // Fallback to logged-in user context
        if (user) {
          setProfile({
            id: user.id || '#USER-001784744516432',
            name: user.name || 'lili',
            email: user.email || 'qwertyuiop@gmail.com',
            role: user.role?.toUpperCase() || 'SALES',
            department: 'SALES Operations',
            securityAccess: 'Verified Token Session',
          })
        } else {
          setError(err.message || 'Failed to load user profile.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const displayUserId = profile?.id
    ? profile.id.startsWith('#')
      ? profile.id
      : `#USER-${profile.id.replace(/-/g, '').slice(0, 15).toUpperCase()}`
    : '#USER-001784744516432'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SalesHeader
        title="Sales Profile"
        subtitle="Manage user session, security levels, and department permissions"
      />

      {/* Main Profile Card Container matching Screenshot 4 */}
      <div className="max-w-2xl mx-auto pt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-3xl border border-[#E8DFC9] shadow-md overflow-hidden"
        >
          {/* Card Header & Avatar */}
          <div className="p-8 bg-[#FAF7F2] border-b border-[#E8DFC9] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-xl pointer-events-none" />

            {/* Avatar Circle */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-400 to-yellow-300 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-400/30 mb-4 border-4 border-white"
            >
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'L'}
            </motion.div>

            {/* Name & Email */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {profile?.name || 'lili'}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {profile?.email || 'qwertyuiop@gmail.com'}
            </p>

            {/* Role Badge */}
            <div className="mt-3">
              <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full uppercase tracking-wider shadow-2xs">
                Role: {profile?.role || 'SALES'}
              </span>
            </div>
          </div>

          {/* User Information Table / Details matching Screenshot 4 */}
          <div className="p-8 space-y-4 divide-y divide-[#F0E8DD]">
            {/* User ID */}
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">User ID</span>
              <span className="font-mono font-extrabold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-lg border border-amber-200">
                {displayUserId}
              </span>
            </div>

            {/* Assigned Department */}
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Assigned Department</span>
              <span className="font-extrabold text-amber-900">
                {profile?.department || 'SALES Operations'}
              </span>
            </div>

            {/* Security Access Level */}
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider">Security Access Level</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {profile?.securityAccess || 'Verified Token Session'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
