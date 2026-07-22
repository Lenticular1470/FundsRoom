'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Product } from '@/lib/types'
import { Plus, Search, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'

interface ProductsApiResult {
  items: Product[]
  total: number
  page: number
  limit: number
}

const mapProduct = (product: any): Product => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  category: product.category || 'General',
  price: Number(product.price),
  cost: product.cost ?? 0,
  stock: product.currentStock ?? product.current_stock ?? 0,
  minStock: product.minimumStock ?? product.minimum_stock ?? 10,
  warehouse: product.warehouse || 'Warehouse A',
  description: product.description ?? '',
  image: product.image ?? '',
  createdAt: product.created_at || product.createdAt,
})

export default function ProductsPage() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: 'Hardware',
    warehouse: 'Warehouse A - Bay 12',
  })

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<ProductsApiResult>('/products', token)
      setProducts(data.items.map(mapProduct))
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch products from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [token])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      alert('Please fill in Product Name and Price.')
      return
    }
    setSubmitting(true)
    try {
      const generateSku = form.sku || `SKU-${Math.floor(100000 + Math.random() * 900000)}`
      await apiPost(
        '/products',
        {
          name: form.name,
          sku: generateSku,
          category: form.category || 'Hardware',
          price: Number(form.price),
          currentStock: Number(form.stock) || 0,
          minimumStock: 10,
          warehouse: form.warehouse,
        },
        token
      )
      setShowModal(false)
      setForm({ name: '', sku: '', price: '', stock: '', category: 'Hardware', warehouse: 'Warehouse A - Bay 12' })
      await loadProducts()
    } catch (err: any) {
      alert(err?.message || 'Failed to create product.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await axiosClient.delete(`/products/${id}`)
      await loadProducts()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete product.')
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock).length

  return (
    <div>
      <DashboardHeader title="Products" description="Manage your product inventory and details" />

      {error && (
        <div className="mb-4 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {lowStockProducts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center space-x-2 text-amber-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{lowStockProducts} product(s) have low stock levels</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex justify-between items-center"
      >
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedProduct(null)
            setForm({
              name: '',
              sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
              price: '',
              stock: '10',
              category: 'Hardware',
              warehouse: 'Warehouse A - Bay 12',
            })
            setShowModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <div className="col-span-full p-10 text-center text-muted-foreground flex justify-center items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full p-10 text-center text-muted-foreground">No products available.</div>
        ) : (
          filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-shadow"
            >
              <div className="mb-3">
                <div className="w-full h-32 bg-muted rounded-lg mb-3 flex flex-col items-center justify-center border border-slate-800">
                  <span className="font-extrabold text-[#00a8d6] text-sm">{product.sku}</span>
                  <span className="text-xs text-slate-400 mt-1">{product.category}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className={`font-bold ${product.stock <= product.minStock ? 'text-red-500' : 'text-emerald-400'}`}>
                    {product.stock} units
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDelete(product.id)}
                  className="w-full p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-500 font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </motion.button>
              </div>
            </motion.div>
          ))
        )}
      </div>

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
            <h2 className="text-xl font-bold text-white mb-4">New Product</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Product Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  required
                  placeholder="Price (₹)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
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
