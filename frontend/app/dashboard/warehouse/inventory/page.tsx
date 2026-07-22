'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, LogIn, LogOut, ArrowUpDown, Filter, Loader2, FileSpreadsheet, Package } from 'lucide-react'
import { InventoryService, InventoryLog } from '@/services/inventory.service'
import { ProductService } from '@/services/product.service'

export default function WarehouseInventoryPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & searches
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'in' | 'out'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'quantity' | 'productName'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [submitting, setSubmitting] = useState(false)
  const [productsList, setProductsList] = useState<any[]>([])

  // Form state
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    reason: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await InventoryService.getMovements()
      setLogs(data.items)

      const prodRes = await ProductService.getProducts({ limit: 100 })
      setProductsList(prodRes.items)
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.productId || !form.quantity) return
    setSubmitting(true)
    try {
      await InventoryService.createMovement({
        productId: form.productId,
        quantity: Number(form.quantity),
        movementType,
        reason: form.reason || `Stock ${movementType.toLowerCase()} via operations board`,
      })
      setShowModal(false)
      setForm({ productId: '', quantity: '', reason: '' })
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to register movement.')
    } finally {
      setSubmitting(false)
    }
  }

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = 'ID,Product Name,Movement Type,Quantity,User,Date,Reason\n'
    const rows = logs
      .map(
        (log) =>
          `"${log.id}","${log.productName}","${log.type.toUpperCase()}",${log.quantity},"${log.createdBy}","${new Date(
            log.createdAt
          ).toLocaleDateString('en-IN')}","${log.reason}"`
      )
      .join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_movements_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter & Sort logs logic
  const filteredLogs = logs
    .filter((log) => {
      const matchSearch =
        log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase())
      const matchType = selectedType === 'all' || log.type === selectedType
      return matchSearch && matchType
    })
    .sort((a, b) => {
      let valA: any = a[sortBy]
      let valB: any = b[sortBy]

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }
    })

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <DashboardHeader
          title="Stock In & Out Operations"
          description="Log and manage stock additions (IN), dispatches (OUT), returns, damages or zone adjustments"
        />
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
          </button>
          <button
            onClick={() => { setMovementType('IN'); setShowModal(true) }}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-colors text-xs"
          >
            <Plus className="w-4 h-4" /> Record In/Out Movement
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-[#0f1115]/90 border border-slate-800/60 p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product name, reason or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-[#181a20] text-slate-200 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 bg-[#181a20] border border-slate-800 rounded-xl p-1">
            {(['all', 'in', 'out'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  selectedType === type
                    ? 'bg-amber-600 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'all' ? 'All Logs' : type === 'in' ? 'Stock IN' : 'Stock OUT'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-[#181a20] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400">
            <ArrowUpDown className="w-4 h-4 text-slate-500" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="createdAt" className="bg-[#181a20]">Date Logged</option>
              <option value="quantity" className="bg-[#181a20]">Quantity</option>
              <option value="productName" className="bg-[#181a20]">Product</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-xs uppercase font-bold text-amber-500 hover:text-amber-400 pl-1"
            >
              {sortOrder}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="font-semibold text-lg text-slate-400">No stock movements registered</p>
          <p className="text-sm opacity-80 mt-1">Try resetting filters or registering a movement</p>
        </div>
      ) : (
        <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-[#171a21] text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Responsible User</th>
                  <th className="px-6 py-4">Logged Time</th>
                  <th className="px-6 py-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-white">{log.productName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold ${
                        log.type === 'in'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {log.type === 'in' ? 'Stock IN' : 'Stock OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-white">
                      {log.type === 'in' ? `+${log.quantity}` : `-${log.quantity}`}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.createdBy}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add movement modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1115] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">Record New Stock Movement</h3>
              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div className="flex gap-2 p-1 bg-[#181a20] border border-slate-850 rounded-xl mb-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('IN')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      movementType === 'IN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Stock IN (Arrival / Adjust-In / Return)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('OUT')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                      movementType === 'OUT' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Stock OUT (Dispatch / Damage / Lost)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Product SKU</label>
                  <select
                    required
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  >
                    <option value="">-- Choose Product SKU --</option>
                    {productsList.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({prod.sku}) - Stock: {prod.currentStock}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="Enter Quantity"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="e.g. Returned by customer Sunita Reddy"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-850 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 ${
                      movementType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Log Movement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
