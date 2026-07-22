'use client'

import { useAuth } from '@/lib/auth-context'
import { Search, Bell } from 'lucide-react'

interface AccountsHeaderProps {
  title?: string
}

export default function AccountsHeader({
  title = 'Financial Analytics & Reports',
}: AccountsHeaderProps) {
  const { user } = useAuth()
  const currentUser = user || { name: 'rahala', email: 'rahala@kk' }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Active Session
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search records, SKU, customer..."
            className="w-64 pl-9 pr-4 py-1.5 bg-[#0c121e] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7] transition-colors"
          />
        </div>

        <button className="p-2 bg-[#0c121e] border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00a8d6] rounded-full" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0c121e] border border-slate-800 rounded-xl text-xs">
          <div className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center font-bold text-[10px]">
            {currentUser.name ? currentUser.name.charAt(0).toLowerCase() : 'r'}
          </div>
          <span className="font-bold text-slate-200">{currentUser.name || 'rahala'}</span>
        </div>
      </div>
    </div>
  )
}
