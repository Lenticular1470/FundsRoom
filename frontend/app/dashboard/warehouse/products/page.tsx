'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Copy, BarChart, Package, Check, Loader2, Eye, Filter } from 'lucide-react'
import { ProductService } from '@/services/product.service'
import { Product } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'price' | 'stock'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Modals / Drawers
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    currentStock: '',
    minimumStock: '',
    warehouse: 'Section A',
  })

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await ProductService.getProducts()
      setProducts(data.items)

      // Extract unique categories
      const cats = Array.from(new Set(data.items.map((p) => p.category || 'General')))
      setCategories(['All', ...cats])
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
      warehouse: 'Section A',
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
      warehouse: product.warehouse || 'Section A',
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
        warehouse: product.warehouse || 'Section A',
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

  // Filter and Sort Products logic
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory
      return matchSearch && matchCat
    })
    .sort((a, b) => {
      let valA: any = a[sortBy === 'stock' ? 'currentStock' : sortBy]
      let valB: any = b[sortBy === 'stock' ? 'currentStock' : sortBy]

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      } else {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }
    })

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <DashboardHeader
          title="Products Catalog & SKUs"
          description="Manage item definitions, pricing, location racks and minimum thresholds"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-colors text-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product SKU
        </motion.button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-[#0f1115]/90 border border-slate-800/60 p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search products by SKU or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-[#181a20] text-slate-200 focus:outline-none focus:border-amber-500 transition-colors text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#181a20] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#181a20]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#181a20] border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="name" className="bg-[#181a20]">Name</option>
              <option value="sku" className="bg-[#181a20]">SKU</option>
              <option value="price" className="bg-[#181a20]">Price</option>
              <option value="stock" className="bg-[#181a20]">Stock</option>
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

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-12 text-center text-slate-500">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="font-semibold text-lg text-slate-400">No products found</p>
          <p className="text-sm opacity-80 mt-1">Try widening your search terms or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const isLowStock = (product.currentStock || 0) <= (product.minimumStock || 0)
            return (
              <motion.div
                key={product.id}
                layout
                className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-colors shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-[#1b1c18] border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase">
                      {product.category || 'General'}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] tracking-wide">
                      {product.sku}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1.5 line-clamp-1">
                    {product.name}
                  </h4>
                  <div className="text-slate-400 text-xs space-y-1 mb-4">
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-slate-200 font-semibold">{product.warehouse || 'Section A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Threshold:</span>
                      <span className="text-slate-200">{product.minimumStock || 0} units</span>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Stock level info */}
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-slate-500 text-xs">Stock Level</span>
                    <span className={`text-sm font-extrabold ${isLowStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {product.currentStock || 0} Units
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-5">
                    <div
                      className={`h-full rounded-full ${isLowStock ? 'bg-rose-600' : 'bg-emerald-600'}`}
                      style={{ width: `${Math.min(((product.currentStock || 0) / ((product.minimumStock || 10) * 2.5)) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-800/40 pt-4">
                    <button
                      onClick={() => { setSelectedProduct(product); setShowDetailDrawer(true) }}
                      className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
                      title="Duplicate Product"
                    >
                      <Copy className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-rose-500 transition-colors ml-auto"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1115] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
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
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="Enter name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">SKU</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="SKU Reference"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="e.g. Peripherals"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="Selling price"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Zone Rack</label>
                    <select
                      value={form.warehouse}
                      onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                      <option value="Overflow Storage">Overflow Storage</option>
                    </select>
                  </div>
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Opening Stock</label>
                    <input
                      type="number"
                      value={form.currentStock}
                      onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="Initial count"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Minimum Threshold</label>
                  <input
                    type="number"
                    value={form.minimumStock}
                    onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="Min alert level"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEditModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-850 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingProduct ? 'Save' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {showDetailDrawer && selectedProduct && (
          <div className="fixed inset-0 bg-black/85 flex justify-end z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-[#0f1115] border-l border-slate-800 w-full max-w-md h-full p-6 overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-800/80 mb-6">
                <h3 className="text-lg font-bold text-white">Product Detail Summary</h3>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div className="bg-[#181a20] border border-slate-800 p-4.5 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">SKU Barcode</p>
                  <div className="bg-white p-3 rounded-lg flex flex-col items-center justify-center">
                    {/* Visual representation of a barcode */}
                    <div className="w-full h-12 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_6px,black_6px,black_10px)]" />
                    <span className="text-xs font-mono text-black mt-2 font-bold tracking-widest">{selectedProduct.sku}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-400 mb-2">Item Specifications</h4>
                  <div className="bg-[#181a20] border border-slate-800 rounded-xl divide-y divide-slate-800/60 text-sm text-slate-200">
                    <div className="p-3.5 flex justify-between">
                      <span className="text-slate-400">Name</span>
                      <span className="font-semibold text-white">{selectedProduct.name}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-slate-400">Category</span>
                      <span className="font-semibold text-white">{selectedProduct.category}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-slate-400">Selling Price</span>
                      <span className="font-semibold text-white">₹{selectedProduct.price}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-slate-400">Assigned Zone</span>
                      <span className="font-semibold text-white">{selectedProduct.warehouse || 'Section A'}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-slate-400">Current Stock</span>
                      <span className="font-semibold text-white">{selectedProduct.currentStock} Units</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-slate-400">Min Alert Limit</span>
                      <span className="font-semibold text-white">{selectedProduct.minimumStock} Units</span>
                    </div>
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
