'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { InventoryLog } from '@/lib/types'
import { Plus, Search, LogIn, LogOut, Trash2, Loader2 } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'

interface StockApiResult {
  items: Array<{
    id: string
    productId: string
    product: { name: string; sku: string }
    quantity: number
    movementType: 'IN' | 'OUT'
    reason: string
    createdAt: string
    createdBy: { name: string }
  }>
  total: number
  page: number
  limit: number
}

const mapStockLog = (log: any): InventoryLog => ({
  id: log.id,
  productId: log.productId,
  productName: log.product?.name || 'Unknown Product',
  quantity: log.quantity,
  type: log.movementType.toLowerCase() as 'in' | 'out',
  reason: log.reason,
  createdAt: log.createdAt,
  createdBy: log.createdBy?.name || 'Admin Staff',
})

export default function InventoryPage() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [productsList, setProductsList] = useState<any[]>([])
  const [productSearch, setProductSearch] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [quantity, setQuantity] = useState('10')
  const [reason, setReason] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [stockData, prodData] = await Promise.all([
        apiGet<StockApiResult>('/stock', token),
        apiGet<any>('/products?limit=100', token),
      ])
      setLogs(stockData.items.map(mapStockLog))
      setProductsList(prodData.items || [])
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch inventory logs from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId || !quantity) {
      alert('Please select a product and enter quantity.')
      return
    }
    setSubmitting(true)
    try {
      await apiPost(
        '/stock',
        {
          productId: selectedProductId,
          movementType,
          quantity: Number(quantity),
          reason: reason || `Admin manual stock adjustment (${movementType})`,
        },
        token
      )
      setShowModal(false)
      setSelectedProductId('')
      setQuantity('10')
      setReason('')
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to create inventory entry.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return
    try {
      await axiosClient.delete(`/stock/${id}`)
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete log.')
    }
  }

  const filteredProductsSelect = productsList.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || log.type === filterType
    return matchesSearch && matchesType
  })

  const totalInbound = logs.filter((l) => l.type === 'in').reduce((sum, l) => sum + l.quantity, 0)
  const totalOutbound = logs.filter((l) => l.type === 'out').reduce((sum, l) => sum + l.quantity, 0)

  return (
    <div>
      <DashboardHeader
        title="Inventory Management"
        description="Track all inventory movements and stock levels"
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Inbound</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalInbound}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <LogIn className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Outbound</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{totalOutbound}</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Movement</p>
              <p className={`text-3xl font-bold ${totalInbound - totalOutbound >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                {totalInbound - totalOutbound}
              </p>
            </div>
            <div className={`p-3 ${totalInbound - totalOutbound >= 0 ? 'bg-amber-500/10' : 'bg-red-500/10'} rounded-lg`}>
              <span className={`text-lg ${totalInbound - totalOutbound >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                {totalInbound - totalOutbound >= 0 ? '+' : ''}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 md:mr-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'in', 'out'] as const).map((type) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filterType === type
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'border border-border text-foreground hover:bg-muted'
                }`}
              >
                {type === 'all' ? 'All' : type === 'in' ? 'Inbound' : 'Outbound'}
              </motion.button>
            ))}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedProductId('')
            setProductSearch('')
            setShowModal(true)
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created By</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{log.productName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          log.type === 'in'
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {log.type === 'in' ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                        <span className="capitalize">{log.type}bound</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">{log.quantity}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.reason}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{log.createdBy}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => handleDelete(log.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Inventory Entry Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-[#181611] border border-amber-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-4">New Inventory Entry</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type to Search & Select Product</label>
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-1.5 mb-2 rounded-lg border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                />
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white focus:outline-none focus:border-amber-500 text-sm"
                >
                  <option value="">Select Product</option>
                  {filteredProductsSelect.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stock: {p.currentStock || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Movement Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white focus:outline-none focus:border-amber-500 text-sm"
                >
                  <option value="IN">Inbound</option>
                  <option value="OUT">Outbound</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason</label>
                <textarea
                  placeholder="Reason for adjustment..."
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-900 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
