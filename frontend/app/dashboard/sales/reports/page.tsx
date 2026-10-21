'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Users,
  FileSpreadsheet,
  BarChart2,
  Download,
  Printer,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Medal,
  CheckCircle2,
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
import SalesHeader from '@/components/sales-header'
import { ReportData } from '@/lib/types'

const PIE_COLORS = ['#F59E0B', '#EAB308', '#D97706', '#B45309', '#78350F']

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function SalesReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [category, setCategory] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ dateFrom: '', dateTo: '', category: '' })
  const [exporting, setExporting] = useState(false)

  const reportFilters = {
    ...(appliedFilters.dateFrom ? { dateFrom: appliedFilters.dateFrom } : {}),
    ...(appliedFilters.dateTo ? { dateTo: appliedFilters.dateTo } : {}),
    ...(appliedFilters.category.trim() ? { category: appliedFilters.category.trim() } : {}),
  }

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosClient.get('/reports', { params: reportFilters })
      setData(res.data?.data || res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load live report analytics.')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // CSV Export trigger
  const handleExportCSV = async () => {
    setExporting(true)
    setError(null)
    try {
      const firstResponse = await axiosClient.get('/challans', {
        params: { ...reportFilters, status: 'CONFIRMED', page: 1, limit: 100 },
      })
      const firstPage = firstResponse.data?.data || firstResponse.data
      const pages = Number(firstPage.totalPages) || 1
      const remainingResponses = await Promise.all(
        Array.from({ length: pages - 1 }, (_, index) =>
          axiosClient.get('/challans', {
            params: { ...reportFilters, status: 'CONFIRMED', page: index + 2, limit: 100 },
          }),
        ),
      )
      const challans = (firstPage.items || []).concat(
        ...remainingResponses.map((response) => {
          const page = response.data?.data || response.data
          return page.items || []
        }),
      )
      const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows = [
        ['Challan Number', 'Customer', 'Date', 'Product', 'SKU', 'Category', 'Quantity', 'Unit Price', 'Line Total'],
        ...challans.flatMap((challan: any) =>
          (challan.items || []).map((item: any) => [
            challan.challanNumber,
            challan.customer?.name || '',
            challan.createdAt ? new Date(challan.createdAt).toLocaleDateString('en-IN') : '',
            item.productName,
            item.sku,
            item.category,
            item.quantity,
            item.price,
            Number(item.price) * Number(item.quantity),
          ]),
        ),
      ]
      const csvContent = rows.map((row) => row.map(csvCell).join(',')).join('\n')
      const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Failed to export sales report.')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SalesHeader
        title="SALES Departmental Analytics & Reports"
        subtitle="Exportable metrics tailored for sales operations"
        onRefresh={fetchReports}
        loading={loading}
      />

      {/* Title Bar & Download PDF button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">SALES Departmental Analytics & Reports</h2>
          <p className="text-xs text-slate-600 font-medium">
            Exportable metrics tailored for sales operations
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            setAppliedFilters({ dateFrom, dateTo, category })
          }}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E8DFC9] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-xs font-semibold text-slate-600">
            From
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-[#E8DFC9] p-2 text-slate-900" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            To
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full rounded-lg border border-[#E8DFC9] p-2 text-slate-900" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Category
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="All categories" className="mt-1 w-full rounded-lg border border-[#E8DFC9] p-2 text-slate-900" />
          </label>
          <button type="submit" disabled={loading} className="self-end rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">
            Apply filters
          </button>
        </form>

        {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {loading && <div role="status" className="flex items-center gap-2 text-sm text-slate-600"><RefreshCw className="h-4 w-4 animate-spin" />Loading live report data…</div>}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownloadPDF}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/25 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Report</span>
        </motion.button>
      </div>

      {/* 3 Main Action Cards matching Screenshot 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Department Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ y: -3 }}
          className="p-6 rounded-3xl bg-white border border-[#E8DFC9] shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Department Summary</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Quarterly audit breakdown for SALES.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#F0E8DD] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Total Revenue: {fmt(data?.summary?.totalRevenue || 0)}</span>
            <ArrowUpRight className="w-4 h-4 text-amber-700" />
          </div>
        </motion.div>

        {/* CSV Data Export */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ y: -3 }}
          onClick={handleExportCSV}
          className="p-6 rounded-3xl bg-white border border-[#E8DFC9] shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">CSV Data Export</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Download formatted CSV spreadsheet containing raw data.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#F0E8DD] flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">{exporting ? 'Preparing export…' : 'Export all matching sales'}</span>
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" /> : <Download className="w-4 h-4 text-emerald-700" />}
          </div>
        </motion.div>

        {/* Print View */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -3 }}
          onClick={() => window.print()}
          className="p-6 rounded-3xl bg-white border border-[#E8DFC9] shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-900 flex items-center justify-center mb-4">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Print View</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Clean formatted printable view for management presentations.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#F0E8DD] flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">Open Print Preview</span>
            <Printer className="w-4 h-4 text-yellow-800" />
          </div>
        </motion.div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Revenue</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{fmt(data?.summary?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Total Confirmed Orders</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.summary?.totalOrders || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Active Customer Base</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.summary?.activeCustomers || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFC9] shadow-xs">
          <p className="text-xs text-slate-500 font-bold uppercase">Average Order Value</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{fmt(data?.summary?.avgOrderValue || 0)}</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Monthly Revenue Trend</h3>
          <p className="text-xs text-slate-500 mb-6">Database analytics for sales growth</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.salesTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DD" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E8DFC9',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="revenue" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="bg-white rounded-3xl p-6 border border-[#E8DFC9] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Top Performing Customers</h3>
            <p className="text-xs text-slate-500 mb-4">Highest revenue generating clients</p>
            <div className="space-y-3">
              {data?.topCustomers?.map((cust, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFC9] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{cust.name}</p>
                      <p className="text-[10px] text-slate-500">{(cust.ordersCount ?? cust.orders ?? 0)} orders completed</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">{fmt(cust.totalSpent ?? cust.totalValue ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
