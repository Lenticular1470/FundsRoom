'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, CheckCircle2, User, Sparkles, RefreshCw, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface SalesHeaderProps {
  title?: string
  subtitle?: string
  searchQuery?: string
  setSearchQuery?: (q: string) => void
  onRefresh?: () => void
  loading?: boolean
}

export default function SalesHeader({
  title = 'Sales & Client Relationship Hub',
  subtitle = 'Real-time analytics and customer interaction portal',
  searchQuery = '',
  setSearchQuery,
  onRefresh,
  loading = false,
}: SalesHeaderProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, title: 'New Customer Registered', time: '10m ago', unread: true },
    { id: 2, title: 'Challan SCH-2026-001 Confirmed', time: '1h ago', unread: true },
    { id: 3, title: 'Follow-up scheduled for Rajesh Sharma', time: '3h ago', unread: false },
  ]

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EFE7DB]">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Session
          </motion.span>
        </div>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Global Search Bar */}
        {setSearchQuery !== undefined && (
          <div className="relative w-64 md:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-amber-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, SKU, customer..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-[#E8DFC9] text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-[#E8DFC9] text-slate-700 hover:text-slate-900 hover:bg-[#F9F5EE] shadow-xs transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </motion.button>
        )}

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white border border-[#E8DFC9] text-slate-700 hover:text-slate-900 hover:bg-[#F9F5EE] shadow-xs transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-amber-700" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E8DFC9] shadow-xl p-3 z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    2 New
                  </span>
                </div>
                <div className="space-y-2 mt-2 max-h-56 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-amber-50/60 transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Pill */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => router.push('/dashboard/sales/profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E8DFC9] shadow-xs cursor-pointer hover:bg-[#FAF7F2] transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-bold flex items-center justify-center text-xs shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'L'}
          </div>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[80px]">
            {user?.name || 'lili'}
          </span>
        </motion.div>
      </div>
    </div>
  )
}
