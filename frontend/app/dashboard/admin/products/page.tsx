'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Product } from '@/lib/types'
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

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
  category: product.category,
  price: Number(product.price),
  cost: product.cost ?? 0,
  stock: product.current_stock ?? 0,
  minStock: product.minimum_stock ?? 0,
  warehouse: product.warehouse,
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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

    loadProducts()
  }, [token])

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock).length

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  return (
    <div>
      <DashboardHeader title="Products" description="Manage your product inventory and details" />

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {lowStockProducts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-center space-x-2 text-yellow-800 dark:text-yellow-200"
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
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedProduct(null)
            setShowModal(true)
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <div className="col-span-full p-10 text-center text-muted-foreground">Loading products...</div>
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
                <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Product Image</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.sku}</p>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold text-foreground">${product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock:</span>
                  <span className={`font-semibold ${product.stock <= product.minStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {product.stock}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      product.stock <= product.minStock ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((product.stock / (product.minStock * 3)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => {
                    setSelectedProduct(product)
                    setShowModal(true)
                  }}
                  className="flex-1 p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary flex items-center justify-center"
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-600 dark:text-red-400 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-card rounded-xl p-6 max-w-md w-full border border-border shadow-xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">
              {selectedProduct ? 'Edit Product' : 'New Product'}
            </h2>
            {selectedProduct ? (
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium text-foreground">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium text-foreground">${selectedProduct.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium text-foreground">{selectedProduct.stock} units</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{selectedProduct.category}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Product Name"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="SKU"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Price"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Stock"
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
                {selectedProduct ? 'Close' : 'Cancel'}
              </motion.button>
              {!selectedProduct && (
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
