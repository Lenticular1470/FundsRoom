'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { InventoryLog } from '@/lib/types'
import { Plus, Search, LogIn, LogOut, Trash2 } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface StockApiResult {
  items: Array<{
    id: string
    productId: string
    product: { name: string }
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
  productName: log.product?.name || 'Unknown',
  quantity: log.quantity,
  type: log.movementType.toLowerCase() as 'in' | 'out',
  reason: log.reason,
  createdAt: log.createdAt,
  createdBy: log.createdBy?.name || 'System',
})

export default function InventoryPage() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStock = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet<StockApiResult>('/stock', token)
        setLogs(data.items.map(mapStockLog))
      } catch (err: any) {
        setError(err?.message || 'Unable to fetch inventory logs from backend.')
      } finally {
        setLoading(false)
      }
    }

    loadStock()
  }, [token])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || log.type === filterType
    return matchesSearch && matchesType
  })

  const handleDelete = (id: string) => {
    setLogs(logs.filter((l) => l.id !== id))
  }

  const totalInbound = logs.filter((l) => l.type === 'in').reduce((sum, l) => sum + l.quantity, 0)
  const totalOutbound = logs.filter((l) => l.type === 'out').reduce((sum, l) => sum + l.quantity, 0)

  return (
    <div>
      <DashboardHeader
        title="Inventory Management"
        description="Track all inventory movements and stock levels"
      />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
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
              <p className={`text-3xl font-bold ${totalInbound - totalOutbound >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
                {totalInbound - totalOutbound}
              </p>
            </div>
            <div className={`p-3 ${totalInbound - totalOutbound >= 0 ? 'bg-primary/10' : 'bg-red-500/10'} rounded-lg`}>
              <span className={`text-lg ${totalInbound - totalOutbound >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
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
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'in', 'out'] as const).map((type) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
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
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow"
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
                    Loading inventory...
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
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {log.type === 'in' ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                        <span className="capitalize">{log.type}bound</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{log.quantity}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.reason}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{log.createdBy}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</td>
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

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-card rounded-xl p-6 max-w-md w-full border border-border shadow-xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">New Inventory Entry</h2>
            <div className="space-y-4 mb-6">
              <select className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Select Product</option>
              </select>
              <select className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="in">Inbound</option>
                <option value="out">Outbound</option>
              </select>
              <input
                type="number"
                placeholder="Quantity"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="Reason"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:shadow-lg transition-shadow"
              >
                Create
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
