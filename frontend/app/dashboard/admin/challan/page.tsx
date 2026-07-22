'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { SalesChallan } from '@/lib/types'
import { Plus, Search, Eye, Trash2, Printer, Loader2 } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'

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
  const [customersList, setCustomersList] = useState<any[]>([])
  const [productsList, setProductsList] = useState<any[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('CONFIRMED')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [challanData, custData, prodData] = await Promise.all([
        apiGet<ChallansApiResult>('/challans', token),
        apiGet<any>('/customers?limit=100', token),
        apiGet<any>('/products?limit=100', token),
      ])
      setChallans(challanData.items.map(mapChallan))
      setCustomersList(custData.items || [])
      setProductsList(prodData.items || [])
    } catch (err: any) {
      setError(err?.message || 'Unable to load challans from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token])

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerId || !selectedProductId) {
      alert('Please select a Customer and at least one Product.')
      return
    }
    const chosenProduct = productsList.find((p) => p.id === selectedProductId)
    if (!chosenProduct) return

    setSubmitting(true)
    try {
      await apiPost(
        '/challans',
        {
          customerId: selectedCustomerId,
          status: challanStatus,
          items: [
            {
              productId: chosenProduct.id,
              quantity: Number(quantity) || 1,
            },
          ],
        },
        token
      )
      setShowModal(false)
      setSelectedCustomerId('')
      setSelectedProductId('')
      setQuantity('1')
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to create sales challan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challan?')) return
    try {
      await axiosClient.delete(`/challans/${id}`)
      await loadData()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete challan.')
    }
  }

  const handlePrint = (challan: SalesChallan) => {
    setSelectedChallan(challan)
    setTimeout(() => {
      window.print()
    }, 200)
  }

  const filteredChallans = challans.filter(
    (c) =>
      c.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="print:bg-white print:text-black">
      <DashboardHeader title="Sales Challans" description="Manage sales delivery challans" />

      {error && (
        <div className="mb-4 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-between items-center print:hidden">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search challan ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedChallan(null)
            setSelectedCustomerId('')
            setSelectedProductId('')
            setQuantity('1')
            setShowModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md transition-all text-sm"
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Total Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Loading challans...
                    </div>
                  </td>
                </tr>
              ) : filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No sales challans recorded.
                  </td>
                </tr>
              ) : (
                filteredChallans.map((challan, idx) => (
                  <motion.tr
                    key={challan.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono font-bold text-amber-400">{challan.challanNumber}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{challan.customerName}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{challan.items.length} item(s)</td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">₹{challan.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          challan.status === 'CONFIRMED'
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : challan.status === 'DRAFT'
                            ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {challan.status.charAt(0).toUpperCase() + challan.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(challan.dueDate).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm print:hidden">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => {
                            setSelectedChallan(challan)
                            setShowModal(true)
                          }}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-amber-500"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handlePrint(challan)}
                          className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-blue-400"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Challan / Details Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 print:hidden"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-[#181611] border border-amber-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-4">
              {selectedChallan ? 'Challan Details' : 'New Challan'}
            </h2>
            {selectedChallan ? (
              <div className="space-y-3 mb-6 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Challan ID</p>
                  <p className="font-mono font-bold text-amber-400">{selectedChallan.challanNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Customer</p>
                  <p className="font-semibold text-white">{selectedChallan.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Amount</p>
                  <p className="font-bold text-white">₹{selectedChallan.totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p className="font-semibold text-emerald-400 capitalize">{selectedChallan.status}</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateChallan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Customer</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Customer</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.businessName ? `(${c.businessName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Product Line Item</label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Select Product Item</option>
                    {productsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ₹{p.price} (In Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select
                      value={challanStatus}
                      onChange={(e) => setChallanStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white focus:outline-none focus:border-amber-500 text-sm"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="DRAFT">DRAFT</option>
                    </select>
                  </div>
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
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
