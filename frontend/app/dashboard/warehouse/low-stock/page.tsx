'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Loader2, ArrowUpRight, Send } from 'lucide-react'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import { Product } from '@/lib/types'

import WarehouseHeader from '@/components/warehouse-header'

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [replenishingProduct, setReplenishingProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('50')
  const [submitting, setSubmitting] = useState(false)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ProductService.getProducts({ limit: 100 })
      const lowStock = data.items.filter((p) => (p.currentStock || 0) <= (p.minimumStock || 10))
      setProducts(lowStock)
    } catch (err: any) {
      setError(err?.message || 'Failed to load low stock items.')
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans pb-12">
      <WarehouseHeader title="Inventory & Stock Operations" />
      {/* Header section matching image 5 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Products Catalog & SKUs</h1>
          <p className="text-slate-400 text-sm">Inventory item definitions, prices, and locations</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => alert('Redirect to add product modal')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0092b8] hover:bg-[#007f9f] text-white font-bold rounded-xl shadow-lg shadow-[#0092b8]/20 transition-all text-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product SKU
        </motion.button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Main Table Card Container matching image 5 */}
      <div className="bg-[#0b1019] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Search bar inside card */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#121824] border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0092b8]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="font-semibold text-slate-400">All products have healthy stock levels!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-[#0f1420]">
                  <th className="py-4 px-6">PRODUCT NAME</th>
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6">CATEGORY</th>
                  <th className="py-4 px-6">UNIT PRICE</th>
                  <th className="py-4 px-6">STOCK LEVEL</th>
                  <th className="py-4 px-6">LOCATION</th>
                  <th className="py-4 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#131a29]/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      {product.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-[#00a8d6] font-medium">
                        {product.sku}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium">
                      {product.category || 'General'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200">
                      {formatPrice(product.price)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {product.currentStock || 0} units
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium">
                      {product.warehouse || 'Warehouse A - Bay 12'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setReplenishingProduct(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0092b8] hover:bg-[#007f9f] text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Stock In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock In Modal */}
      <AnimatePresence>
        {replenishingProduct && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1019] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Replenish Low Stock Item</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">
                Log fresh shipment intake directly for <span className="text-[#00a8d6] font-semibold">{replenishingProduct.name}</span>.
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
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReplenishingProduct(null)}
                    className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-[#009e74] hover:bg-[#008763] text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
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
