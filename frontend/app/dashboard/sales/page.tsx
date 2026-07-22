'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  ArrowUpRight,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'
import SalesHeader from '@/components/sales-header'

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
      <SalesHeader
        title="Sales & Client Relationship Hub"
        subtitle="Real-time analytics, customer database & sales challans"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Hero Workspace Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl p-7 bg-white border border-[#E8DFC9] shadow-sm relative overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-gradient-to-br from-yellow-200/40 to-amber-300/30 blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sales & Client Workspace
              </h2>
              <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                Warm Yellow Theme
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 font-medium max-w-2xl">
              Convert leads into active clients, maintain customer relations, and issue delivery challans backed by real database metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/dashboard/sales/customers')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/dashboard/sales/challans')}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-amber-100/60 border border-[#E0D5BE] text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-700" />
              <span>Create Challan</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-[#E8DFC9] shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Confirmed Sales
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : formatCurrency(data?.todaysSales || 0)}
            </h3>
            <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live DB calculation</span>
            </p>
          </div>
        </motion.div>

        {/* Monthly Sales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-[#E8DFC9] shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Monthly Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-800 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : formatCurrency(data?.monthlySales || 0)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              MTD Confirmed Orders
            </p>
          </div>
        </motion.div>

        {/* Active Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-[#E8DFC9] shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Clients
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-xs border border-amber-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : (data?.activeClients || 0)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Active database records
            </p>
          </div>
        </motion.div>

        {/* Pending Challans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-white border border-[#E8DFC9] shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Draft Challans
            </span>
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-yellow-900 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : (data?.pendingChallans || 0)}
            </h3>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              Awaiting confirmation
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Section: Sales Trend Chart & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F0E8DD]">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Sales Trend Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly revenue overview over recent period</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-300">
              Live Chart
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DD" />
                  <XAxis dataKey="label" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E8DFC9',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (₹)"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Upcoming Follow-ups List (1 Col) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-xs flex flex-col"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E8DD]">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Upcoming Follow-ups</h3>
              <p className="text-xs text-slate-500 mt-0.5">Key scheduled client interactions</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/sales/customers')}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
            >
              View All
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[280px]">
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : filteredFollowUps && filteredFollowUps.length > 0 ? (
              filteredFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE7DB] hover:border-amber-300 transition-all flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                      {item.businessName || item.phone}
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-1">
                      Date: {new Date(item.followUpDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    item.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-yellow-100 text-yellow-900'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No upcoming follow-ups found.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
