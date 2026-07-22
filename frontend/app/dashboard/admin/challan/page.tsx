'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { SalesChallan } from '@/lib/types'
import { Plus, Search, Eye, Trash2, Printer } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface ChallansApiResult {
  items: Array<{
    id: string
    challanNumber: string
    customer?: { name: string }
    items: Array<{
      productId: string | null
      productName: string
      sku: string
      category: string
      price: number
      quantity: number
    }>
    status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
    createdAt: string
    createdBy?: { name: string }
  }>
  total: number
  page: number
  limit: number
}

const mapChallan = (challan: any): SalesChallan => {
  const items = (challan.items || []).map((item: any) => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    category: item.category,
    price: Number(item.price),
    quantity: item.quantity,
  }))

  return {
    id: challan.id,
    challanNumber: challan.challanNumber,
    customerName: challan.customer?.name || 'Unknown Customer',
    items,
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: challan.status,
    dueDate: challan.createdAt,
    createdAt: challan.createdAt,
    createdBy: challan.createdBy?.name || 'System',
  }
}

export default function ChallanPage() {
  const { token } = useAuth()
  const [challans, setChallans] = useState<SalesChallan[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChallans = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet<ChallansApiResult>('/challans', token)
        setChallans(data.items.map(mapChallan))
      } catch (err: any) {
        setError(err?.message || 'Unable to load challans from backend.')
      } finally {
        setLoading(false)
      }
    }

    loadChallans()
  }, [token])

  const filteredChallans = challans.filter((c) =>
    c.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    setChallans(challans.filter((c) => c.id !== id))
  }

  return (
    <div>
      <DashboardHeader title="Sales Challans" description="Manage sales delivery challans" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-between items-center">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search challan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedChallan(null)
            setShowModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Challan</span>
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl border border-border overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Challan ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredChallans.map((challan, idx) => (
                <motion.tr
                  key={challan.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{challan.challanNumber}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{challan.items.length} item(s)</td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">${challan.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        challan.status === 'CONFIRMED'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : challan.status === 'DRAFT'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {challan.status.charAt(0).toUpperCase() + challan.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(challan.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => {
                          setSelectedChallan(challan)
                          setShowModal(true)
                        }}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                      >
                        <Printer className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => handleDelete(challan.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
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
            <h2 className="text-xl font-bold text-foreground mb-4">
              {selectedChallan ? 'Challan Details' : 'New Challan'}
            </h2>
            {selectedChallan ? (
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Challan ID</p>
                  <p className="font-medium text-foreground">{selectedChallan.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="font-medium text-foreground">{selectedChallan.items.length} item(s)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-foreground">${selectedChallan.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground capitalize">{selectedChallan.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium text-foreground">{new Date(selectedChallan.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <select className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Select Customer</option>
                  <option>Tech Corp</option>
                  <option>Design Inc</option>
                </select>
                <input
                  type="text"
                  placeholder="Challan ID"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Total Amount"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                {selectedChallan ? 'Close' : 'Cancel'}
              </motion.button>
              {!selectedChallan && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:shadow-lg transition-shadow"
                >
                  Create
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
