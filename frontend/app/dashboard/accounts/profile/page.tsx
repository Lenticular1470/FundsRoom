'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, UserCheck, Hash } from 'lucide-react'
import AccountsHeader from '@/components/accounts-header'
import { useAuth } from '@/lib/auth-context'

export default function AccountsProfilePage() {
  const { user } = useAuth()
  const currentUser = user || {
    id: '001784751188604',
    name: 'rahala',
    email: 'rahala@kk',
    role: 'ACCOUNTS',
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans pb-12">
      <AccountsHeader title="Financial Analytics & Reports" />

      <div className="flex justify-center items-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl bg-[#0b1019] border border-slate-800/80 rounded-2xl p-8 shadow-2xl"
        >
          {/* User Header */}
          <div className="flex flex-col items-center text-center pb-8 border-b border-slate-800/70">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 border-2 border-cyan-400/40">
              {currentUser.name ? currentUser.name.charAt(0).toLowerCase() : 'r'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-0.5">{currentUser.name || 'rahala'}</h2>
            <p className="text-sm text-slate-400 mb-3">{currentUser.email || 'rahala@kk'}</p>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-full uppercase tracking-wider">
              Role: {currentUser.role || 'ACCOUNTS'}
            </span>
          </div>

          {/* Profile Details List */}
          <div className="pt-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-800/40">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500" /> User ID
              </span>
              <span className="font-mono text-sm font-bold text-white tracking-wide">
                #USER-{(currentUser.id || '001784751188604').toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-800/40">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" /> Assigned Department
              </span>
              <span className="font-bold text-cyan-400 text-sm">
                ACCOUNTS Operations
              </span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Access Level
              </span>
              <span className="font-bold text-emerald-400 text-sm">
                Verified Token Session
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
