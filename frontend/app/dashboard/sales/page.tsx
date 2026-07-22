'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  UserPlus,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  Bell,
  CheckCircle2,
  CalendarDays,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'

interface DashboardData {
  todaysSales: number
  monthlySales: number
  todaysLeads: number
  activeClients: number
  followUpsCount: number
  pendingChallans: number
  notificationsCount: number
  salesTrend: Array<{ label: string; revenue: number; orders: number }>
  upcomingFollowUps: Array<{
    id: string
    name: string
    businessName?: string | null
    phone: string
    email?: string | null
    followUpDate: string
    status: string
  }>
}

export default function SalesDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosClient.get('/dashboard')
      if (response.data?.data) {
        setData(response.data.data)
      } else {
        setData(response.data)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load live dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const filteredFollowUps = data?.upcomingFollowUps.filter((item) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      (item.businessName && item.businessName.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Sales & Client Relationship Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Session
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics and customer interaction portal
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, customer, phone..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications Icon with Badge */}
          <div className="relative">
            <button
              onClick={() => router.push('/dashboard/sales/orders')}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {data && data.notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-[10px] font-bold text-slate-950 rounded-full flex items-center justify-center">
                  {data.notificationsCount}
                </span>
              )}
            </button>
          </div>

          {/* Logged in User Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
              {user?.name || 'Sales User'}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Workspace Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-900/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-white">Sales & Client Workspace</h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Emerald Theme
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Convert leads, maintain customer relations, and generate sales challans seamlessly.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/sales/customers?action=new')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-xs text-red-200 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Today's Sales */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Today's Sales
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(data?.todaysSales || 0)}
            </h3>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live Sync
            </p>
          </div>
        </motion.div>

        {/* 2. Monthly Sales */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Monthly Sales
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : formatCurrency(data?.monthlySales || 0)}
            </h3>
            <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Confirmed
            </p>
          </div>
        </motion.div>

        {/* 3. Today's Leads */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Today's Leads
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : data?.todaysLeads ?? 0}
            </h3>
            <p className="text-[10px] text-teal-400 mt-1">New customer prospects</p>
          </div>
        </motion.div>

        {/* 4. Active Clients */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Active Clients
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : data?.activeClients ?? 0}
            </h3>
            <p className="text-[10px] text-sky-400 mt-1">Total active accounts</p>
          </div>
        </motion.div>

        {/* 5. Follow-ups */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Follow-ups
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : data?.followUpsCount ?? 0}
            </h3>
            <p className="text-[10px] text-amber-400 mt-1">Scheduled calls/meetings</p>
          </div>
        </motion.div>

        {/* 6. Pending Challans */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Pending Challans
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : data?.pendingChallans ?? 0}
            </h3>
            <p className="text-[10px] text-rose-400 mt-1">Draft orders pending</p>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Charts & Upcoming Followups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80 shadow-lg flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Sales Performance Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly revenue closed over recent billing periods
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-300 font-medium">Sales Closed (₹)</span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : data?.salesTrend && data.salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.salesTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <CalendarDays className="w-10 h-10 mb-2 opacity-50" />
                <span>No historical sales data recorded yet.</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Follow-ups Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80 shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Upcoming Follow-ups
            </h3>
            <button
              onClick={() => router.push('/dashboard/sales/customers')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[320px] pr-1">
            {loading ? (
              <div className="py-12 flex justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredFollowUps && filteredFollowUps.length > 0 ? (
              filteredFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {item.businessName || item.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {new Date(item.followUpDate).toLocaleDateString('en-GB')}
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/sales/customers?id=${item.id}`)}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No upcoming follow-ups scheduled.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
