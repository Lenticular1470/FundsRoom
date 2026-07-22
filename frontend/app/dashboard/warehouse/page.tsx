'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Package, AlertCircle, TrendingUp, TrendingDown, Plus, LogIn, LogOut, Loader2, Warehouse, Activity } from 'lucide-react'
import { WarehouseService, WarehouseStats } from '@/services/warehouse.service'
import { ProductService } from '@/services/product.service'
import { InventoryService } from '@/services/inventory.service'
import WarehouseHeader from '@/components/warehouse-header'

const COLORS = ['#d97706', '#b45309', '#92400e', '#fbbf24']

export default function WarehouseDashboard() {
  const [stats, setStats] = useState<WarehouseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    currentStock: '',
    minimumStock: '',
    warehouse: 'Section A',
  })

  const [movementForm, setMovementForm] = useState({
    productId: '',
    quantity: '',
    reason: '',
  })

  const [productsList, setProductsList] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await WarehouseService.getDashboardStats()
      setStats(data)

      const prodRes = await ProductService.getProducts({ limit: 100 })
      setProductsList(prodRes.items)
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name || !productForm.sku || !productForm.category) return
    try {
      setSubmitting(true)
      await ProductService.createProduct({
        name: productForm.name,
        sku: productForm.sku,
        category: productForm.category,
        price: Number(productForm.price) || 0,
        currentStock: Number(productForm.currentStock) || 0,
        minimumStock: Number(productForm.minimumStock) || 0,
        warehouse: productForm.warehouse,
      })
      setShowProductModal(false)
      setProductForm({
        name: '',
        sku: '',
        category: '',
        price: '',
        currentStock: '',
        minimumStock: '',
        warehouse: 'Section A',
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!movementForm.productId || !movementForm.quantity) return
    try {
      setSubmitting(true)
      await InventoryService.createMovement({
        productId: movementForm.productId,
        quantity: Number(movementForm.quantity),
        movementType: movementType,
        reason: movementForm.reason || `Stock ${movementType.toLowerCase()} via dashboard`,
      })
      setShowMovementModal(false)
      setMovementForm({ productId: '', quantity: '', reason: '' })
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to register movement')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-200">
        <p className="font-semibold">Error Loading Stats</p>
        <p className="text-sm opacity-80">{error}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-semibold">
          Retry
        </button>
      </div>
    )
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="min-h-screen text-[#FAF7F2] font-sans">
      <WarehouseHeader title="Inventory & Stock Operations" />

      {/* Main Command Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#1b1c18]/80 border border-[#EFE7DB]/15 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-xl"
        style={{
          backgroundImage: 'radial-gradient(circle at top right, rgba(217, 119, 6, 0.08), transparent 50%)'
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold text-[#FAF7F2]">Warehouse & Inventory Command Center</h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
                Amber Theme
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-2xl">
              Real-time stock control, inventory movement tracking, and low-stock alerts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <button
              onClick={() => { setMovementType('IN'); setShowMovementModal(true) }}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 text-sm"
            >
              <LogIn className="w-4 h-4" /> Stock In
            </button>
            <button
              onClick={() => { setMovementType('OUT'); setShowMovementModal(true) }}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 text-sm"
            >
              <LogOut className="w-4 h-4" /> Stock Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            icon: <Warehouse className="w-5 h-5 text-amber-500" />,
            label: 'INVENTORY SUMMARY',
            value: `${stats?.totalInventoryQuantity.toLocaleString() || 0} Units`,
            desc: 'Total aggregate items in stock',
            color: 'text-amber-500'
          },
          {
            icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
            label: 'LOW STOCK ALERTS',
            value: stats?.lowStockCount || 0,
            desc: 'Products at min threshold',
            color: 'text-rose-500'
          },
          {
            icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
            label: "TODAY'S STOCK IN",
            value: `+${stats?.todayStockIn || 0} Units`,
            desc: 'Received shipments today',
            color: 'text-emerald-500'
          },
          {
            icon: <TrendingDown className="w-5 h-5 text-orange-500" />,
            label: "TODAY'S STOCK OUT",
            value: `-${stats?.todayStockOut || 0} Units`,
            desc: 'Dispatched orders today',
            color: 'text-orange-500'
          }
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-[#0f1115]/90 border border-slate-800/60 p-6 rounded-2xl shadow-md hover:border-slate-700/60 transition-colors flex items-start gap-4"
          >
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{card.label}</p>
              <h3 className="text-2xl font-extrabold text-[#FAF7F2] mb-1">{card.value}</h3>
              <p className="text-xs text-slate-400 font-medium">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stock Movement Graph */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-6 shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-[#FAF7F2] flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Stock Movement History (IN vs OUT)
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.stockHistory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="date" stroke="#6b7280" tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1115',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="stockIn" fill="#d97706" name="Stock IN" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stockOut" fill="#b45309" name="Stock OUT" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Zone Storage Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-6 shadow-md"
        >
          <h3 className="text-base font-bold text-[#FAF7F2] mb-6 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-amber-500" />
            Warehouse Zone Storage
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={stats?.zoneStorage || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ zone, percent }) => `${zone} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="zone"
              >
                {(stats?.zoneStorage || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f1115',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs">
            {(stats?.zoneStorage || []).map((entry, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-400">{entry.zone}:</span>
                <span className="font-semibold text-slate-200">{entry.value} Units</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Movements Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0f1115]/90 border border-slate-800/60 rounded-2xl p-6 shadow-md"
      >
        <h3 className="text-base font-bold text-[#FAF7F2] mb-4">Recent Stock Movements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs uppercase bg-[#171a21] text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Movement Type</th>
                <th className="px-6 py-3.5">Quantity</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {(stats?.recentMovements || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No recent transactions registered.
                  </td>
                </tr>
              ) : (
                stats?.recentMovements.map((movement, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{movement.productName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        movement.movementType === 'IN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {movement.movementType === 'IN' ? 'Stock IN' : 'Stock OUT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {movement.movementType === 'IN' ? `+${movement.quantity}` : `-${movement.quantity}`}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{movement.createdBy}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(movement.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{movement.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1115] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">Add New Product</h3>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
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
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="e.g. SKU-1234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="e.g. Cables"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="Price"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Zone Location</label>
                    <select
                      value={productForm.warehouse}
                      onChange={(e) => setProductForm({ ...productForm, warehouse: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                      <option value="Overflow Storage">Overflow Storage</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Opening Stock</label>
                    <input
                      type="number"
                      value={productForm.currentStock}
                      onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="Opening quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Minimum Stock</label>
                    <input
                      type="number"
                      value={productForm.minimumStock}
                      onChange={(e) => setProductForm({ ...productForm, minimumStock: e.target.value })}
                      className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                      placeholder="Reorder point"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
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
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Movement Modal (Stock In / Stock Out) */}
      <AnimatePresence>
        {showMovementModal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1115] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">
                Record Stock {movementType === 'IN' ? 'Inbound' : 'Outbound'}
              </h3>
              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Select Product</label>
                  <select
                    required
                    value={movementForm.productId}
                    onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors text-sm"
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
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Reason / Description</label>
                  <input
                    type="text"
                    value={movementForm.reason}
                    onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                    className="w-full bg-[#181a20] border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    placeholder="e.g. Shipment delivery / Client dispatch"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMovementModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-850 hover:bg-slate-900 rounded-xl text-slate-400 font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 ${
                      movementType === 'IN' ? 'bg-emerald-605 hover:bg-emerald-700' : 'bg-rose-605 hover:bg-rose-700'
                    }`}
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm
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
