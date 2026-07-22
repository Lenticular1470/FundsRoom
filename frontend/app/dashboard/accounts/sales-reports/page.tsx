'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, FileSpreadsheet, Printer, Download, Loader2 } from 'lucide-react'
import AccountsHeader from '@/components/accounts-header'
import axiosClient from '@/lib/axiosClient'

export default function AccountsSalesReportsPage() {
  const [loading, setLoading] = useState(false)
  const [challans, setChallans] = useState<any[]>([])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await axiosClient.get('/challans')
      setChallans(res.data?.data?.items || [])
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePrintView = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = 'Challan Number,Customer,Status,Date\n'
    const rows = challans
      .map(
        (c) =>
          `"${c.challanNumber}","${c.customer?.name || 'Customer'}","${c.status}","${new Date(
            c.createdAt
          ).toLocaleDateString('en-IN')}"`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accounts_sales_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans pb-12 print:bg-white print:text-black">
      <AccountsHeader title="Financial Analytics & Reports" />

      {/* Header Banner matching Image 2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            ACCOUNTS Departmental Analytics & Reports
          </h1>
          <p className="text-slate-400 text-sm">
            Exportable metrics tailored for accounts operations
          </p>
        </div>
        <button
          onClick={handlePrintView}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-[#172033] hover:bg-[#1e2b45] border border-slate-700 text-white font-bold rounded-xl shadow-lg transition-all text-xs self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" /> Download PDF Report
        </button>
      </div>

      {/* 3 Report Action Cards matching Image 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
        {/* Card 1 */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={() => alert('Quarterly Audit Summary breakdown loaded')}
          className="bg-[#0b1019] border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between h-44"
        >
          <div>
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 w-fit mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Department Summary</h3>
            <p className="text-xs text-slate-400">Quarterly audit breakdown for ACCOUNTS.</p>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={handleExportCSV}
          className="bg-[#0b1019] border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between h-44"
        >
          <div>
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 w-fit mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">CSV Data Export</h3>
            <p className="text-xs text-slate-400">
              Download formatted CSV spreadsheet containing raw data.
            </p>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          whileHover={{ y: -4 }}
          onClick={handlePrintView}
          className="bg-[#0b1019] border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between h-44"
        >
          <div>
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 w-fit mb-4">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Print View</h3>
            <p className="text-xs text-slate-400">
              Clean formatted printable view for management presentations.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#0b1019] border border-slate-800/80 rounded-2xl p-6 shadow-md print:border-black print:bg-white print:text-black">
        <h3 className="text-sm font-bold text-white mb-4 print:text-black">
          Sales Challans & Financial Records Ledger
        </h3>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-[#121824] text-slate-400 border-b border-slate-800/80 print:bg-white print:text-black">
                <tr>
                  <th className="px-6 py-3">Challan No</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 print:divide-black">
                {challans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors print:hover:bg-white">
                    <td className="px-6 py-3.5 font-mono text-cyan-400 font-bold print:text-black">{c.challanNumber}</td>
                    <td className="px-6 py-3.5 font-semibold text-white print:text-black">{c.customer?.name || 'Customer'}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : c.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 print:text-black">
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
