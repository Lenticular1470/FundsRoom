'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, LogOut, Loader2 } from 'lucide-react'
import { InventoryService, InventoryLog } from '@/services/inventory.service'
import { ProductService } from '@/services/product.service'

import WarehouseHeader from '@/components/warehouse-header'

export default function WarehouseInventoryPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [submitting, setSubmitting] = useState(false)
  const [productsList, setProductsList] = useState<any[]>([])

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans pb-12">
      <WarehouseHeader title="Inventory & Stock Operations" />
      {/* Header section matching image 4 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Inventory Movements & Stock Ledger
          </h1>
          <p className="text-slate-400 text-sm">
            Track Stock IN / Stock OUT audit logs and current warehouse inventory
          </p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setMovementType('IN'); setShowModal(true) }}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-[#009e74] hover:bg-[#008763] text-white font-bold rounded-xl shadow-lg shadow-[#009e74]/20 transition-all text-sm"
          >
            <LogIn className="w-4 h-4" /> Stock IN
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setMovementType('OUT'); setShowModal(true) }}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-[#e11d48] hover:bg-[#be123c] text-white font-bold rounded-xl shadow-lg shadow-[#e11d48]/20 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" /> Stock OUT
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Audit History Card matching image 4 */}
      <div className="bg-[#0b1019] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/60">
          <h2 className="text-base font-bold text-white">Inventory Log Audit History</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0092b8]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-slate-400">No inventory logs registered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-[#0f1420]">
                  <th className="py-4 px-6">DATE</th>
                  <th className="py-4 px-6">PRODUCT</th>
                  <th className="py-4 px-6">MOVEMENT</th>
                  <th className="py-4 px-6">QUANTITY</th>
                  <th className="py-4 px-6">REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#131a29]/50 transition-colors">
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {log.productName}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                        log.type === 'in'
                          ? 'bg-[#009e74]/15 text-[#00c994] border border-[#009e74]/30'
                          : 'bg-[#e11d48]/15 text-[#ff4d73] border border-[#e11d48]/30'
                      }`}>
                        {log.type === 'in' ? 'STOCK IN' : 'STOCK OUT'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-white">
                      {log.quantity}
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movement Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1019] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">
                Record Stock {movementType === 'IN' ? 'IN' : 'OUT'}
              </h3>
              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Select Product</label>
                  <select
                    required
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                  >
                    <option value="">-- Choose Product --</option>
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
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                    placeholder="Enter Quantity"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Reason / Description</label>
                  <input
                    type="text"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                    placeholder="e.g. Vendor stock shipment received"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 ${
                      movementType === 'IN' ? 'bg-[#009e74] hover:bg-[#008763]' : 'bg-[#e11d48] hover:bg-[#be123c]'
                    }`}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm {movementType}
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
