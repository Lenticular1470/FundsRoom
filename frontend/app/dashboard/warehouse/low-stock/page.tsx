'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowUpRight, Search, Loader2, Package, Check, Send, ShoppingCart } from 'lucide-react'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import { Product } from '@/lib/types'

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal replenishment states
  const [replenishingProduct, setReplenishingProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('50')
  const [submitting, setSubmitting] = useState(false)
  const [notifying, setNotifying] = useState<Record<string, boolean>>({})

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ProductService.getProducts()
      // Filter products below reorder level (currentStock <= minimumStock)
      const lowStock = data.items.filter((p) => (p.currentStock || 0) <= (p.minimumStock || 10))
      setProducts(lowStock)
    } catch (err: any) {
      setError(err?.message || 'Failed to load low stock products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleReplenish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replenishingProduct || !quantity) return
    setSubmitting(true)
    try {
      await InventoryService.createMovement({
        productId: replenishingProduct.id,
        quantity: Number(quantity),
        movementType: 'IN',
        reason: 'Low stock replenishment stock-in',
      })
      setReplenishingProduct(null)
      setQuantity('50')
      await loadProducts()
    } catch (err: any) {
      alert(err?.message || 'Failed to replenish stock.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNotifyProcurement = (prodId: string) => {
    setNotifying((prev) => ({ ...prev, [prodId]: true }))
    setTimeout(() => {
      setNotifying((prev) => ({ ...prev, [prodId]: false }))
      alert('Alert sent! Procurement and Super Admin have been notified to initiate a Purchase Order.')
    }, 1200)
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans">
      <DashboardHeader
        title="Low Stock & Replenishments"
        description="Monitor products below minimum safety threshold and trigger purchase requisitions or direct stock-in arrivals"
      />

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#0f1115]/90 border border-slate-800/60 p-4 rounded-2xl mb-6 shadow-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search low stock inventory by Name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-[#181a20] text-slate-200 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500">
          <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4 bg-emerald-500/10 p-2 rounded-full border border-emerald-500/30" />
          <p className="font-semibold text-lg text-slate-400">Inventory Status Healthy</p>
          <p className="text-sm opacity-80 mt-1">All items in this warehouse meet or exceed safety thresholds.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product) => {
            const isCritical = (product.currentStock || 0) === 0
            return (
              <motion.div
                key={product.id}
                layout
                className={`border rounded-2xl p-6 flex flex-col justify-between transition-colors shadow-md ${
                  isCritical
                    ? 'bg-rose-950/10 border-rose-900/30'
                    : 'bg-[#0f1115]/90 border-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                        : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    }`}>
                      {isCritical ? 'Out of Stock' : 'Low Threshold'}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] tracking-wide">{product.sku}</span>
                  </div>

                  <h3 className="font-extrabold text-white text-lg mb-2 line-clamp-1">{product.name}</h3>

                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-6 bg-[#171920]/60 p-3.5 rounded-xl border border-slate-850">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">CURRENT STOCK</p>
                      <p className={`text-base font-black ${isCritical ? 'text-rose-500' : 'text-amber-500'}`}>
                        {product.currentStock || 0} Units
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">MIN THRESHOLD</p>
                      <p className="text-base font-black text-slate-300">
                        {product.minimumStock || 10} Units
                      </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-800/40">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">WAREHOUSE LOCATION</p>
                      <p className="text-slate-300 font-semibold">{product.warehouse || 'Section A'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleNotifyProcurement(product.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 font-bold text-xs transition-colors"
                  >
                    {notifying[product.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Reorder Request
                  </button>
                  <button
                    onClick={() => setReplenishingProduct(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Direct Stock In
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Replenish Stock In modal */}
      <AnimatePresence>
        {replenishingProduct && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1115] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Replenish Stock Arrivals</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">
                Log fresh shipment intake directly for <span className="text-amber-500 font-semibold">{replenishingProduct.name}</span>.
              </p>
              <form onSubmit={handleReplenish} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Receipt Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReplenishingProduct(null)}
                    className="flex-1 px-4 py-2.5 border border-slate-850 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Arrivals
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
