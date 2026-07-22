'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { FileText, Printer, FileSpreadsheet, Loader2, ArrowUpRight, BarChart3, PieChart } from 'lucide-react'
import { ReportService, InventoryReportData } from '@/services/report.service'

export default function ReportsPage() {
  const [report, setReport] = useState<InventoryReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('All')

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await ReportService.getInventoryReport()
      setReport(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!report) return
    const headers = 'SKU,Product Name,Category,Current Stock,Unit Price,Total Value,Status\n'
    const rows = (report.products || [])
      .map(
        (p) =>
          `"${p.sku}","${p.name}","${p.category}",${p.stock},${p.price},${p.value},"${p.status}"`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  const uniqueCategories = report
    ? ['All', ...Array.from(new Set(report.products.map((p) => p.category || 'General')))]
    : ['All']

  const filteredProducts = report
    ? report.products.filter(
        (p) => categoryFilter === 'All' || p.category === categoryFilter
      )
    : []

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
        <DashboardHeader
          title="Warehouse Reports & Audits"
          description="Generate full inventory stock report summaries, values, and location logs"
        />
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-colors text-xs"
          >
            <Printer className="w-4 h-4" /> Print / PDF Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200 print:hidden">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 print:hidden">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : !report ? (
        <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="font-semibold text-lg text-slate-400">Failed to generate report</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Catalogued Products', value: report.summary.totalProducts, desc: 'Registered SKUs' },
              { label: 'Total Inventory Stock', value: `${report.summary.totalStock.toLocaleString()} Units`, desc: 'Aggregate items in warehouse' },
              { label: 'Valuation of Assets', value: formatCurrency(report.summary.totalValue), desc: 'Cost valuation basis' },
              { label: 'Low Stock Flagged', value: report.summary.lowStockCount, desc: 'Requires attention' },
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-[#0f1115]/90 border border-slate-800/60 p-5 rounded-2xl shadow-sm print:border-black print:bg-white print:text-black"
              >
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                <h4 className="text-xl font-extrabold text-[#FAF7F2] print:text-black">{card.value}</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Category breakdown table */}
          <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-6 shadow-md print:border-black print:bg-white print:text-black">
            <h3 className="text-sm font-bold text-slate-400 mb-4 print:text-black uppercase tracking-wider">Stock Valuation by Category</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[#171a21] text-slate-400 print:bg-white print:text-black border-b border-slate-800/80">
                  <tr>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Items in Stock</th>
                    <th className="px-6 py-3 text-right">Inventory Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 print:divide-black">
                  {report.categories.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors print:hover:bg-white">
                      <td className="px-6 py-3 font-semibold text-white print:text-black">{cat.category}</td>
                      <td className="px-6 py-3 text-right text-slate-300 print:text-black">{cat.stock.toLocaleString()} Units</td>
                      <td className="px-6 py-3 text-right font-bold text-amber-500 print:text-black">{formatCurrency(cat.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail List */}
          <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-6 shadow-md print:border-black print:bg-white print:text-black">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Detailed Inventory Ledger</h3>
              <div className="flex items-center gap-2 bg-[#181a20] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                <span>Filter Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none font-semibold cursor-pointer ml-1"
                >
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c} className="bg-[#181a20]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[#171a21] text-slate-400 border-b border-slate-800/80 print:bg-white print:text-black">
                  <tr>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">In Stock</th>
                    <th className="px-6 py-3 text-right">Unit Price</th>
                    <th className="px-6 py-3 text-right">Total Valuation</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 print:divide-black">
                  {filteredProducts.map((prod, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors print:hover:bg-white">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-400 print:text-black">{prod.sku}</td>
                      <td className="px-6 py-3.5 font-bold text-white print:text-black">{prod.name}</td>
                      <td className="px-6 py-3.5 text-slate-400 print:text-black">{prod.category}</td>
                      <td className="px-6 py-3.5 text-right text-slate-300 print:text-black">{prod.stock}</td>
                      <td className="px-6 py-3.5 text-right text-slate-300 print:text-black">₹{prod.price}</td>
                      <td className="px-6 py-3.5 text-right font-bold text-white print:text-black">₹{prod.value}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.status === 'IN_STOCK'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : prod.status === 'LOW_STOCK'
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                        }`}>
                          {prod.status === 'IN_STOCK' ? 'Healthy' : prod.status === 'LOW_STOCK' ? 'Low Level' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
