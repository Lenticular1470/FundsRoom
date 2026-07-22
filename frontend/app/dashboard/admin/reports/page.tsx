'use client'

import { useEffect, useState } from 'react'
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
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, FileText, Loader2, Sparkles } from 'lucide-react'
import axiosClient from '@/lib/axiosClient'

const COLORS = ['#d97706', '#059669', '#0891b2', '#8b5cf6']

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<{
    salesTrend: any[]
    categoryData: any[]
    recentReports: any[]
  }>({
    salesTrend: [
      { month: 'Jan', sales: 4000, target: 3500 },
      { month: 'Feb', sales: 3000, target: 3500 },
      { month: 'Mar', sales: 5000, target: 4000 },
      { month: 'Apr', sales: 4500, target: 4500 },
      { month: 'May', sales: 6200, target: 5000 },
      { month: 'Jun', sales: 5800, target: 5500 },
    ],
    categoryData: [
      { name: 'Hardware', value: 45 },
      { name: 'Networking', value: 30 },
      { name: 'Cables & Accessories', value: 25 },
    ],
    recentReports: [
      {
        id: 1,
        title: 'Monthly Sales Report',
        type: 'Sales',
        date: new Date().toISOString().split('T')[0],
        description: 'Comprehensive sales analysis and confirmed order metrics',
      },
      {
        id: 2,
        title: 'Inventory Status Report',
        type: 'Inventory',
        date: new Date().toISOString().split('T')[0],
        description: 'Current stock levels, low-stock warnings, and movements',
      },
      {
        id: 3,
        title: 'Customer Analysis',
        type: 'Customer',
        date: new Date().toISOString().split('T')[0],
        description: 'Customer segmentation, business leads, and active clients',
      },
      {
        id: 4,
        title: 'Financial Summary',
        type: 'Financial',
        date: new Date().toISOString().split('T')[0],
        description: 'Revenue totals, invoiced amounts, and accounts ledger',
      },
    ],
  })

  const handleDownloadSingleReport = async (reportType: string, title: string) => {
    try {
      setLoading(true)
      let csvContent = `Report Title,${title}\nGenerated Date,${new Date().toLocaleString()}\n\n`

      if (reportType === 'Sales' || reportType === 'Financial') {
        const res = await axiosClient.get('/challans')
        const items = res.data?.data?.items || []
        csvContent += 'Challan Number,Customer,Status,Date,Total Amount\n'
        items.forEach((c: any) => {
          const total = (c.items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0)
          csvContent += `"${c.challanNumber}","${c.customer?.name || 'Client'}","${c.status}","${new Date(
            c.createdAt
          ).toLocaleDateString('en-IN')}",${total}\n`
        })
      } else if (reportType === 'Inventory') {
        const res = await axiosClient.get('/products')
        const items = res.data?.data?.items || []
        csvContent += 'SKU,Product Name,Category,In Stock,Unit Price\n'
        items.forEach((p: any) => {
          csvContent += `"${p.sku}","${p.name}","${p.category}",${p.currentStock || 0},${p.price}\n`
        })
      } else {
        const res = await axiosClient.get('/customers')
        const items = res.data?.data?.items || []
        csvContent += 'Customer Name,Email,Phone,Company,Status\n'
        items.forEach((cust: any) => {
          csvContent += `"${cust.name}","${cust.email || ''}","${cust.phone || ''}","${
            cust.businessName || ''
          }","${cust.status}"\n`
        })
      }

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Failed to generate report file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNewReport = async () => {
    try {
      setLoading(true)
      const [challansRes, productsRes, customersRes] = await Promise.all([
        axiosClient.get('/challans'),
        axiosClient.get('/products'),
        axiosClient.get('/customers'),
      ])

      const challans = challansRes.data?.data?.items || []
      const products = productsRes.data?.data?.items || []
      const customers = customersRes.data?.data?.items || []

      let reportText = `====================================================\n`
      reportText += `   FUNDSROOM MINI ERP & CRM MASTER AUDIT REPORT\n`
      reportText += `   Generated On: ${new Date().toLocaleString()}\n`
      reportText += `====================================================\n\n`

      reportText += `1. EXECUTIVE SUMMARY\n`
      reportText += `----------------------------------------------------\n`
      reportText += `Total Registered Customers: ${customers.length}\n`
      reportText += `Total Catalog Products:     ${products.length}\n`
      reportText += `Total Sales Challans:       ${challans.length}\n\n`

      reportText += `2. PRODUCTS & INVENTORY SNAPSHOT\n`
      reportText += `----------------------------------------------------\n`
      products.forEach((p: any) => {
        reportText += `SKU: ${p.sku} | ${p.name} | Stock: ${p.currentStock || 0} units | Price: ₹${p.price}\n`
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
      alert('Error compiling report: ' + err.message)
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales Performance</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reportData.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#d97706"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#059669"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={reportData.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={{ fill: 'var(--color-foreground)' }}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.categoryData.map((entry, index) => (
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
          {reportData.recentReports.map((report, idx) => (
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
