'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Copy, Loader2, Eye, Filter } from 'lucide-react'
import { ProductService } from '@/services/product.service'
import { Product } from '@/lib/types'

import WarehouseHeader from '@/components/warehouse-header'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    currentStock: '',
    minimumStock: '',
    warehouse: 'Warehouse A - Bay 12',
  })

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ProductService.getProducts({ limit: 100 })
      setProducts(data.items)
    } catch (err: any) {
      setError(err?.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setForm({
      name: '',
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      category: '',
      price: '',
      currentStock: '0',
      minimumStock: '10',
      warehouse: 'Warehouse A - Bay 12',
    })
    setShowAddEditModal(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      currentStock: String(product.currentStock || 0),
      minimumStock: String(product.minimumStock || 0),
      warehouse: product.warehouse || 'Warehouse A - Bay 12',
    })
    setShowAddEditModal(true)
  }

  const handleDuplicate = async (product: Product) => {
    try {
      setLoading(true)
      await ProductService.createProduct({
        name: `${product.name} (Copy)`,
        sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
        category: product.category,
        price: product.price,
        currentStock: 0,
        minimumStock: product.minimumStock || 0,
        warehouse: product.warehouse || 'Warehouse A - Bay 12',
      })
      await loadProducts()
    } catch (err: any) {
      alert(err?.message || 'Failed to duplicate product.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      setLoading(true)
      await ProductService.deleteProduct(id)
      await loadProducts()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, {
          name: form.name,
          sku: form.sku,
          category: form.category,
          price: Number(form.price),
          minimumStock: Number(form.minimumStock),
          warehouse: form.warehouse,
        })
      } else {
        await ProductService.createProduct({
          name: form.name,
          sku: form.sku,
          category: form.category,
          price: Number(form.price),
          currentStock: Number(form.currentStock),
          minimumStock: Number(form.minimumStock),
          warehouse: form.warehouse,
        })
      }
      setShowAddEditModal(false)
      await loadProducts()
    } catch (err: any) {
      alert(err?.message || 'Failed to save product.')
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
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Products Catalog & SKUs</h1>
          <p className="text-slate-400 text-sm">Inventory item definitions, prices, and locations</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenAdd}
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

      {/* Main Table Card Container matching image 3 */}
      <div className="bg-[#0b1019] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Search bar inside the card header */}
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
            <p className="font-semibold text-slate-400">No products found in catalog</p>
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
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {filteredProducts.map((product) => {
                  const isLow = (product.currentStock || 0) <= (product.minimumStock || 10)
                  return (
                    <tr key={product.id} className="hover:bg-[#131a29]/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        {product.name}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          onClick={() => { setSelectedProduct(product); setShowDetailDrawer(true) }}
                          className="font-mono text-[#00a8d6] hover:underline cursor-pointer font-medium"
                        >
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isLow
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {product.currentStock || 0} units
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-medium">
                        {product.warehouse || 'Warehouse A - Bay 12'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedProduct(product); setShowDetailDrawer(true) }}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="View Product"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Duplicate SKU"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1019] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">
                {editingProduct ? 'Edit Product SKU' : 'Add Product SKU'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                    placeholder="e.g. Enterprise Server Rack 42U"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">SKU Code</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                      placeholder="e.g. SRK-42U-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                      placeholder="e.g. Hardware"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                      placeholder="e.g. 45000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Location Rack</label>
                    <input
                      type="text"
                      value={form.warehouse}
                      onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                      placeholder="e.g. Warehouse A - Bay 12"
                    />
                  </div>
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Current Stock</label>
                    <input
                      type="number"
                      value={form.currentStock}
                      onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                      placeholder="Initial stock"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Minimum Alert Limit</label>
                  <input
                    type="number"
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                    className="w-full bg-[#121824] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#0092b8] transition-colors text-sm"
                    placeholder="Reorder limit"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-[#0092b8] hover:bg-[#007f9f] text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Details Drawer */}
      <AnimatePresence>
        {showDetailDrawer && selectedProduct && (
          <div className="fixed inset-0 bg-black/85 flex justify-end z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="bg-[#0b1019] border-l border-slate-800 w-full max-w-md h-full p-6 overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
                <h3 className="text-lg font-bold text-white">SKU Specification Summary</h3>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6 flex-1 text-sm">
                <div className="bg-[#121824] border border-slate-800 p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-[#0092b8] uppercase mb-1">SKU Barcode</p>
                  <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center">
                    <div className="w-full h-12 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_6px,black_6px,black_10px)]" />
                    <span className="text-xs font-mono text-black mt-2 font-bold tracking-widest">{selectedProduct.sku}</span>
                  </div>
                </div>

                <div className="bg-[#121824] border border-slate-800 rounded-xl divide-y divide-slate-800/80">
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">Product Name</span>
                    <span className="font-semibold text-white">{selectedProduct.name}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">SKU Code</span>
                    <span className="font-mono text-[#00a8d6] font-bold">{selectedProduct.sku}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">Category</span>
                    <span className="font-semibold text-white">{selectedProduct.category}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">Unit Price</span>
                    <span className="font-bold text-white">{formatPrice(selectedProduct.price)}</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">Current Stock</span>
                    <span className="font-extrabold text-emerald-400">{selectedProduct.currentStock} units</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">Minimum Threshold</span>
                    <span className="font-semibold text-white">{selectedProduct.minimumStock} units</span>
                  </div>
                  <div className="p-3.5 flex justify-between">
                    <span className="text-slate-400">Warehouse Location</span>
                    <span className="font-semibold text-white">{selectedProduct.warehouse || 'Warehouse A - Bay 12'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
