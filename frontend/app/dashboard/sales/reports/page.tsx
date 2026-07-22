'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  BarChart2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Medal,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import axiosClient from '@/lib/axiosClient'
import { ReportData } from '@/lib/types'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtCompact = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  Icon: React.ElementType
  iconClass: string
  delay?: number
}

function StatCard({ title, value, sub, Icon, iconClass, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconClass} bg-opacity-10 border border-opacity-20`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-600" />
      </div>
      <p className="text-xs text-slate-400 font-medium mt-4 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

export default function SalesReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosClient.get('/reports')
      setData(res.data?.data || res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-slate-400 text-sm">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-300 text-sm">{error}</p>
        <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs hover:bg-slate-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    )
  }

  const trendData = data?.salesTrend?.map(d => ({
    name: d.month,
    Revenue: d.revenue,
    Orders: d.orders,
  })) || []

  const pieData = data?.productDistribution?.map(d => ({
    name: d.category,
    value: d.revenue,
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-400" />
            Sales Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live analytics from your PostgreSQL data</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs hover:bg-slate-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Today's Sales"
          value={fmtCompact(data?.todaysSales || 0)}
          sub="Confirmed challans"
          Icon={DollarSign}
          iconClass="text-emerald-400 bg-emerald-400"
          delay={0}
        />
        <StatCard
          title="Monthly Revenue"
          value={fmtCompact(data?.monthlyRevenue || 0)}
          sub="This month so far"
          Icon={TrendingUp}
          iconClass="text-blue-400 bg-blue-400"
          delay={0.05}
        />
        <StatCard
          title="Total Customers"
          value={(data?.totalCustomers || 0).toLocaleString()}
          sub="All time"
          Icon={Users}
          iconClass="text-violet-400 bg-violet-400"
          delay={0.1}
        />
        <StatCard
          title="Pending Challans"
          value={(data?.pendingChallans || 0).toLocaleString()}
          sub="Awaiting confirmation"
          Icon={FileText}
          iconClass="text-amber-400 bg-amber-400"
          delay={0.15}
        />
        <StatCard
          title="Completed Orders"
          value={(data?.completedChallans || 0).toLocaleString()}
          sub="Confirmed challans"
          Icon={ShoppingCart}
          iconClass="text-teal-400 bg-teal-400"
          delay={0.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg"
        >
          <h3 className="text-sm font-bold text-white mb-1">Revenue Trend</h3>
          <p className="text-[11px] text-slate-400 mb-4">Last 6 months confirmed sales</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => fmtCompact(v)} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number, name: string) => [name === 'Revenue' ? fmt(v) : v, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                <Line type="monotone" dataKey="Orders" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No trend data yet</div>
          )}
        </motion.div>

        {/* Category Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg"
        >
          <h3 className="text-sm font-bold text-white mb-1">Category Revenue</h3>
          <p className="text-[11px] text-slate-400 mb-4">Sales distribution by product category</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 11 }}
                    formatter={(v: number) => [fmt(v), 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-300 truncate max-w-[100px]">{d.name}</span>
                    </div>
                    <span className="text-white font-mono font-semibold">{fmtCompact(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No category data yet</div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Orders Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg"
        >
          <h3 className="text-sm font-bold text-white mb-1">Monthly Orders Volume</h3>
          <p className="text-[11px] text-slate-400 mb-4">Number of confirmed orders per month</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="Orders" fill="#6366f1" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No order data yet</div>
          )}
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-5 shadow-lg"
        >
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-400" />
            Top Customers by Revenue
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">Highest-spending clients all time</p>
          {data?.topCustomers && data.topCustomers.length > 0 ? (
            <div className="space-y-2.5">
              {data.topCustomers.map((c, i) => {
                const maxVal = data.topCustomers[0]?.totalValue || 1
                const pct = Math.round((c.totalValue / maxVal) * 100)
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{medals[i] || `${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                        <span className="text-[11px] font-bold text-emerald-400 font-mono ml-2 flex-shrink-0">{fmtCompact(c.totalValue)}</span>
                      </div>
                      <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{c.orders} order{c.orders !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-slate-500 text-sm">No customer data yet</div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
