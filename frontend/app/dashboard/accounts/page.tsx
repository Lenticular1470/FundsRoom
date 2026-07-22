'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  Users,
  Loader2,
} from 'lucide-react'
import AccountsHeader from '@/components/accounts-header'
import axiosClient from '@/lib/axiosClient'

interface AccountsDashboardData {
  totalConfirmedRevenue: number
  todaysRevenue: number
  confirmedChallansCount: number
  cancelledChallansCount: number
  topBillingClients: Array<{
    name: string
    businessName: string
    totalValue: number
  }>
  revenueTrend: Array<{
    month: string
    revenue: number
  }>
}

export default function AccountsDashboard() {
  const [data, setData] = useState<AccountsDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAccountsData = async () => {
    try {
      setLoading(true)
      const res = await axiosClient.get('/dashboard/accounts')
      setData(res.data?.data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load accounts dashboard metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccountsData()
  }, [])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const handlePrintPDF = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!data) return
    const headers = 'Client Name,Business Name,Billed Revenue\n'
    const rows = (data.topBillingClients || [])
      .map((c) => `"${c.name}","${c.businessName}",${c.totalValue}`)
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans pb-12 print:bg-white print:text-black">
      <AccountsHeader title="Financial Analytics & Reports" />

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200 print:hidden">
          {error}
        </div>
      )}

      {/* Main Banner matching image 1 */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#0c0a1a]/90 border border-purple-900/30 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl print:hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at top right, rgba(168, 85, 247, 0.12), transparent 55%)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-white">Accounts & Financial Oversight</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-extrabold tracking-wider uppercase">
                Purple Theme
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Financial monitoring, revenue trend analysis, and exportable accounts ledger.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all text-xs"
            >
              <Download className="w-4 h-4" /> Export CSV Report
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-[#00a896] hover:bg-[#008f80] text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all text-xs"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* 4 Stat Cards matching image 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0b1019] border border-slate-800/80 p-6 rounded-2xl shadow-md flex items-start justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              TOTAL CONFIRMED REVENUE
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-2xl font-extrabold text-white">
                {formatCurrency(data?.totalConfirmedRevenue || 0)}
              </h3>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +16.8%
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Net revenue from confirmed challans</p>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0b1019] border border-slate-800/80 p-6 rounded-2xl shadow-md flex items-start justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              TODAY'S REVENUE
            </p>
            <h3 className="text-2xl font-extrabold text-white mb-1">
              {formatCurrency(data?.todaysRevenue || 0)}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Invoiced revenue generated today</p>
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0b1019] border border-slate-800/80 p-6 rounded-2xl shadow-md flex items-start justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              CONFIRMED SALES CHALLANS
            </p>
            <h3 className="text-2xl font-extrabold text-white mb-1">
              {data?.confirmedChallansCount || 0}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Approved order transactions</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 4 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0b1019] border border-slate-800/80 p-6 rounded-2xl shadow-md flex items-start justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              CANCELLED SALES VALUE
            </p>
            <h3 className="text-2xl font-extrabold text-white mb-1">
              {data?.cancelledChallansCount || 0}
            </h3>
            <p className="text-xs text-slate-400 font-medium">Revoked challans</p>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Main Charts & Clients Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revenue Trend Chart (2/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#0b1019] border border-slate-800/80 rounded-2xl p-6 shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Revenue & Financial Growth Trend
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 h-3 rounded bg-purple-500 border border-purple-400" />
              <span>Gross Revenue (₹)</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data?.revenueTrend || []}>
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#172033" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b1019',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                }}
                formatter={(val: number) => [formatCurrency(val), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#a855f7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#purpleGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Right: Top Billing Enterprise Clients (1/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0b1019] border border-slate-800/80 rounded-2xl p-6 shadow-md flex flex-col justify-between"
        >
          <div>
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Top Billing Enterprise Clients
            </h3>

            <div className="space-y-4">
              {(data?.topBillingClients || []).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No confirmed billing clients recorded yet.
                </p>
              ) : (
                data?.topBillingClients.map((client, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#121824] border border-slate-800/70 rounded-xl flex justify-between items-center hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{client.name}</h4>
                      <p className="text-xs text-slate-400">{client.businessName}</p>
                    </div>
                    <span className="font-extrabold text-[#00c994] text-sm">
                      {formatCurrency(client.totalValue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
