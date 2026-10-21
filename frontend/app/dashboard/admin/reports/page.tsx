'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Download, FileText, Loader2, Sparkles } from 'lucide-react'
import axiosClient from '@/lib/axiosClient'

const COLORS = ['#d97706', '#059669', '#0891b2', '#8b5cf6']

interface AdminReportsData {
  summary: {
    totalRevenue: number
    totalOrders: number
    activeCustomers: number
    avgOrderValue: number
  }
  salesTrend: Array<{ month: string; revenue: number; orders: number }>
  categoryData: Array<{ name: string; value: number }>
  topCustomers: Array<{ name: string; orders: number; totalValue: number }>
  recentReports: Array<{ id: string; title: string; type: string; date: string; description: string }>
}

const recentReports = [
  { id: 'sales', title: 'Monthly Sales Report', type: 'Sales', description: 'Confirmed challans matching the selected filters' },
  { id: 'inventory', title: 'Inventory Status Report', type: 'Inventory', description: 'Current product stock levels and value' },
  { id: 'customers', title: 'Customer Analysis', type: 'Customer', description: 'Customer records and account status' },
  { id: 'financial', title: 'Financial Summary', type: 'Financial', description: 'Confirmed sales and revenue details' },
]

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

const downloadFile = (content: string, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

const fetchAllPages = async <T,>(path: string, params: Record<string, string | number> = {}): Promise<T[]> => {
  const firstResponse = await axiosClient.get(path, { params: { ...params, page: 1, limit: 100 } })
  const firstPage = firstResponse.data?.data || firstResponse.data
  const firstItems: T[] = firstPage.items || []
  const totalPages = Number(firstPage.totalPages) || 1
  if (totalPages <= 1) return firstItems

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      axiosClient.get(path, { params: { ...params, page: index + 2, limit: 100 } }),
    ),
  )
  return firstItems.concat(...remainingPages.map((response) => {
    const page = response.data?.data || response.data
    return (page.items || []) as T[]
  }))
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [category, setCategory] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ dateFrom: '', dateTo: '', category: '', warehouse: '' })
  const [reportData, setReportData] = useState<AdminReportsData | null>(null)

  const reportFilters = {
    ...(appliedFilters.dateFrom ? { dateFrom: appliedFilters.dateFrom } : {}),
    ...(appliedFilters.dateTo ? { dateTo: appliedFilters.dateTo } : {}),
    ...(appliedFilters.category.trim() ? { category: appliedFilters.category.trim() } : {}),
    ...(appliedFilters.warehouse.trim() ? { warehouse: appliedFilters.warehouse.trim() } : {}),
  }

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosClient.get('/reports', { params: reportFilters })
      const data = response.data?.data || response.data
      setReportData({
        summary: data.summary,
        salesTrend: data.salesTrend || [],
        topCustomers: data.topCustomers || [],
        categoryData: (data.productDistribution || []).map((entry: { category: string; revenue: number }) => ({
          name: entry.category,
          value: entry.revenue,
        })),
        recentReports: recentReports.map((report) => ({
          ...report,
          date: new Date().toISOString().split('T')[0],
        })),
      })
    } catch (err: any) {
      setReportData(null)
      setError(err?.message || 'Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleDownloadSingleReport = async (reportType: string, title: string) => {
    try {
      setLoading(true)
      setError(null)
      let csvContent = `Report Title,${csvCell(title)}\nGenerated Date,${csvCell(new Date().toLocaleString())}\n\n`

      if (reportType === 'Sales' || reportType === 'Financial') {
        const items = await fetchAllPages<any>('/challans', { ...reportFilters, status: 'CONFIRMED' })
        csvContent += 'Challan Number,Customer,Status,Date,Total Amount\n'
        items.forEach((c: any) => {
          const total = (c.items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0)
          csvContent += `${csvCell(c.challanNumber)},${csvCell(c.customer?.name || 'Client')},${csvCell(c.status)},${csvCell(
            new Date(c.createdAt).toLocaleDateString('en-IN')
          )},${total}\n`
        })
      } else if (reportType === 'Inventory') {
        const res = await axiosClient.get('/reports/inventory', { params: reportFilters })
        const items = res.data?.data?.products || []
        csvContent += 'SKU,Product Name,Category,In Stock,Unit Price\n'
        items.forEach((p: any) => {
          csvContent += `${csvCell(p.sku)},${csvCell(p.name)},${csvCell(p.category)},${p.stock || 0},${p.price}\n`
        })
      } else {
        const items = await fetchAllPages<any>('/customers')
        csvContent += 'Customer Name,Email,Phone,Company,Status\n'
        items.forEach((cust: any) => {
          csvContent += `${csvCell(cust.name)},${csvCell(cust.email)},${csvCell(cust.phone)},${csvCell(
            cust.businessName
          )},${csvCell(cust.status)}\n`
        })
      }

      downloadFile(
        csvContent,
        `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv;charset=utf-8',
      )
    } catch (err: any) {
      setError(err?.message || 'Failed to generate report file.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNewReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const [challans, productsRes, customers] = await Promise.all([
        fetchAllPages<any>('/challans', { ...reportFilters, status: 'CONFIRMED' }),
        axiosClient.get('/reports/inventory', { params: reportFilters }),
        fetchAllPages<any>('/customers'),
      ])

      const products = productsRes.data?.data?.products || []

      let reportText = `====================================================\n`
      reportText += `   FUNDSROOM MINI ERP & CRM MASTER AUDIT REPORT\n`
      reportText += `   Generated On: ${new Date().toLocaleString()}\n`
      reportText += `   Date Range: ${appliedFilters.dateFrom || 'All'} to ${appliedFilters.dateTo || 'All'}\n`
      reportText += `   Category: ${appliedFilters.category || 'All'}\n`
      reportText += `   Warehouse: ${appliedFilters.warehouse || 'All'}\n`
      reportText += `====================================================\n\n`

      reportText += `1. EXECUTIVE SUMMARY\n`
      reportText += `----------------------------------------------------\n`
      reportText += `Total Registered Customers: ${customers.length}\n`
      reportText += `Total Catalog Products:     ${products.length}\n`
      reportText += `Total Sales Challans:       ${challans.length}\n\n`

      reportText += `2. PRODUCTS & INVENTORY SNAPSHOT\n`
      reportText += `----------------------------------------------------\n`
      products.forEach((p: any) => {
        reportText += `SKU: ${p.sku} | ${p.name} | Stock: ${p.stock || 0} units | Price: ₹${p.price}\n`
      })
      reportText += `\n3. RECENT SALES CHALLANS\n`
      reportText += `----------------------------------------------------\n`
      challans.forEach((c: any) => {
        reportText += `Challan #${c.challanNumber} | Client: ${c.customer?.name || 'N/A'} | Status: ${c.status}\n`
      })

      const blob = new Blob([reportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `master_erp_audit_report_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || 'Error compiling report.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <DashboardHeader
        title="Reports & Analytics"
        description="View detailed business analytics and generate reports"
      />

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setAppliedFilters({ dateFrom, dateTo, category, warehouse })
        }}
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="text-sm text-muted-foreground">
          From
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-foreground" />
        </label>
        <label className="text-sm text-muted-foreground">
          To
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-foreground" />
        </label>
        <label className="text-sm text-muted-foreground">
          Category
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="All categories" className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-foreground" />
        </label>
        <label className="text-sm text-muted-foreground">
          Warehouse
          <input value={warehouse} onChange={(event) => setWarehouse(event.target.value)} placeholder="All warehouses" className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-foreground" />
        </label>
        <button disabled={loading} type="submit" className="self-end rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">
          Apply filters
        </button>
      </form>

      {error && <div role="alert" className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loading && <div role="status" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading report data…</div>}

      {reportData && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-xl font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(reportData.summary.totalRevenue)}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Confirmed orders</p><p className="text-xl font-bold">{reportData.summary.totalOrders}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Active customers</p><p className="text-xl font-bold">{reportData.summary.activeCustomers}</p></div>
          <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Average order value</p><p className="text-xl font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(reportData.summary.avgOrderValue)}</p></div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales Performance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportData?.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#d97706"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
          {!loading && reportData?.salesTrend.length === 0 && <p className="mt-3 text-center text-sm text-muted-foreground">No sales data for these filters.</p>}
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={reportData?.categoryData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={{ fill: 'var(--color-foreground)' }}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {(reportData?.categoryData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {!loading && reportData?.categoryData.length === 0 && <p className="mt-3 text-center text-sm text-muted-foreground">No category sales for these filters.</p>}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-6 border border-border shadow-sm mb-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Reports</h2>
        <div className="space-y-3">
          {(reportData?.recentReports || []).map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-amber-500/10 rounded-lg mt-1 text-amber-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs px-2.5 py-0.5 bg-amber-500/15 text-amber-400 font-bold rounded uppercase">
                      {report.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{report.date}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDownloadSingleReport(report.type, report.title)}
                className="p-2.5 hover:bg-amber-500/20 rounded-xl transition-colors text-amber-500"
                title="Download Report"
              >
                <Download className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerateNewReport}
        disabled={loading}
        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        Generate New Report
      </motion.button>
    </div>
  )
}
