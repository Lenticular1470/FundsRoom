'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Printer,
  Package,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import axiosClient from '@/lib/axiosClient'
import { Challan, Customer, Product, ChallanItem } from '@/lib/types'

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
const challanItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name required'),
  sku: z.string().min(1, 'SKU required'),
  category: z.string().min(1, 'Category required'),
  price: z.number({ invalid_type_error: 'Price required' }).nonnegative(),
  quantity: z.number({ invalid_type_error: 'Qty required' }).int().positive('Qty must be positive'),
})

const createChallanSchema = z.object({
  customerId: z.string().uuid('Select a valid customer'),
  items: z.array(challanItemSchema).min(1, 'Add at least one item'),
})

type CreateChallanForm = z.infer<typeof createChallanSchema>

interface ToastState { type: 'success' | 'error'; message: string }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalesChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewingChallan, setViewingChallan] = useState<Challan | null>(null)
  const [deletingChallan, setDeletingChallan] = useState<Challan | null>(null)
  const [printChallan, setPrintChallan] = useState<Challan | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateChallanForm>({
    resolver: zodResolver(createChallanSchema),
    defaultValues: { customerId: '', items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const grandTotal = watchedItems?.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  ) || 0

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchChallans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/challans', {
        params: { search, page, limit: 10 },
      })
      const d = res.data?.data || res.data
      let items: Challan[] = d.items || []
      if (statusFilter !== 'ALL') {
        items = items.filter((c) => c.status === statusFilter)
      }
      setChallans(items)
      setTotal(d.total || 0)
      setTotalPages(d.totalPages || Math.ceil((d.total || 1) / 10))
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load challans.')
    } finally {
      setLoading(false)
    }
  }, [search, page, statusFilter])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axiosClient.get('/customers', { params: { limit: 200 } })
      const d = res.data?.data || res.data
      setCustomers(d.items || [])
    } catch {}
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axiosClient.get('/products', { params: { limit: 200 } })
      const d = res.data?.data || res.data
      setProducts(d.items || [])
    } catch {}
  }, [])

  useEffect(() => { fetchChallans() }, [fetchChallans])
  useEffect(() => { fetchCustomers(); fetchProducts() }, [fetchCustomers, fetchProducts])

  // ─── Create Challan ──────────────────────────────────────────────────────────
  const onCreateSubmit = async (data: CreateChallanForm, confirm = false) => {
    try {
      const res = await axiosClient.post('/challans', data)
      const newChallan = res.data?.data
      if (confirm && newChallan?.id) {
        await axiosClient.post(`/challans/${newChallan.id}/confirm`, {})
        showToast('success', 'Challan created and confirmed successfully!')
      } else {
        showToast('success', 'Challan saved as draft successfully!')
      }
      setIsCreateOpen(false)
      reset({ customerId: '', items: [] })
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save challan.')
    }
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleConfirm = async (challan: Challan) => {
    try {
      await axiosClient.post(`/challans/${challan.id}/confirm`, {})
      showToast('success', `Challan #${challan.challanNumber} confirmed!`)
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Confirmation failed.')
    }
  }

  const handleCancel = async (challan: Challan) => {
    try {
      await axiosClient.put(`/challans/${challan.id}`, { status: 'CANCELLED' })
      showToast('success', `Challan #${challan.challanNumber} cancelled.`)
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Cancellation failed.')
    }
  }

  const handleDelete = async () => {
    if (!deletingChallan) return
    try {
      await axiosClient.delete(`/challans/${deletingChallan.id}`)
      showToast('success', `Challan #${deletingChallan.challanNumber} deleted.`)
      setDeletingChallan(null)
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed.')
    }
  }

  // ─── Add product to form ─────────────────────────────────────────────────────
  const addProductToForm = (product: Product) => {
    append({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      price: Number(product.price),
      quantity: 1,
    })
  }

  const addBlankItem = () => {
    append({ productName: '', sku: '', category: '', price: 0, quantity: 1 })
  }

  // ─── Print ───────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!printRef.current) return
    const w = window.open('', '_blank', 'width=800,height=600')
    if (!w) return
    w.document.write(`
      <html><head><title>Challan Print</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ddd;padding:8px 12px;font-size:13px}
        th{background:#f5f5f5;font-weight:600}
        .header{display:flex;justify-content:space-between;margin-bottom:24px}
        .badge{padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700}
        .CONFIRMED{background:#d1fae5;color:#065f46}
        .DRAFT{background:#fef3c7;color:#92400e}
        .CANCELLED{background:#fee2e2;color:#991b1b}
        .total{text-align:right;font-size:16px;font-weight:700;margin-top:16px}
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  const calcChallanTotal = (challan: Challan) =>
    challan.items.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0)

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return map[status] || 'bg-slate-800 text-slate-300 border-slate-700'
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              toast.type === 'success' ? 'bg-emerald-950 border-emerald-800 text-emerald-200' : 'bg-red-950 border-red-800 text-red-200'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Sales Challans
          </h1>
          <p className="text-xs text-slate-400 mt-1">Create, confirm, and manage delivery challans</p>
        </div>
        <button
          onClick={() => { reset({ customerId: '', items: [] }); setIsCreateOpen(true) }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> New Challan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search challan number, customer..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          <span className="text-white font-bold">{challans.length}</span> of <span className="text-white font-bold">{total}</span> challans
        </span>
      </div>

      {/* Challans Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Challan #</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5">Total Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <span>Loading challans...</span>
                </td></tr>
              ) : challans.length > 0 ? challans.map((challan) => (
                <tr key={challan.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">{challan.challanNumber}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{challan.customer?.name || '—'}</p>
                    <p className="text-[10px] text-slate-400">{challan.customer?.businessName || challan.customer?.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      {challan.items?.length || 0} item{(challan.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-white font-mono">{fmt(calcChallanTotal(challan))}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${statusBadge(challan.status)}`}>
                      {challan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                    {new Date(challan.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewingChallan(challan)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setPrintChallan(challan); setTimeout(handlePrint, 100) }}
                        className="p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-blue-950 transition-colors" title="Print">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {challan.status === 'DRAFT' && (
                        <button onClick={() => handleConfirm(challan)}
                          className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-emerald-950 transition-colors" title="Confirm">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {challan.status === 'DRAFT' && (
                        <button onClick={() => handleCancel(challan)}
                          className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-950 transition-colors" title="Cancel">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => setDeletingChallan(challan)}
                        className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                  No challans found. Create your first challan.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create Challan Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative mb-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" /> Create Sales Challan
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form className="space-y-5 text-xs">
                {/* Customer Select */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Select Customer *</label>
                  <select {...register('customerId')}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500/50 cursor-pointer">
                    <option value="">— Choose a customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-red-400 mt-1">{errors.customerId.message}</p>}
                </div>

                {/* Quick Product Picker */}
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Quick Add Product</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {products.map(p => (
                      <button key={p.id} type="button" onClick={() => addProductToForm(p)}
                        className="text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all">
                        <p className="font-semibold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.sku} · Stock: {p.currentStock ?? p.stock ?? '—'}</p>
                        <p className="text-emerald-400 font-mono text-[11px] mt-0.5">₹{Number(p.price).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-300 font-medium">Challan Items *</label>
                    <button type="button" onClick={addBlankItem}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-emerald-950/30 transition-colors text-[11px] font-medium">
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>

                  {errors.items?.message && <p className="text-red-400 mb-2">{errors.items.message}</p>}

                  <div className="space-y-2">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="col-span-3">
                          <input {...register(`items.${idx}.productName`)} placeholder="Product name"
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500/50 text-[11px]" />
                          {errors.items?.[idx]?.productName && <p className="text-red-400 text-[10px] mt-0.5">{errors.items[idx]?.productName?.message}</p>}
                        </div>
                        <div className="col-span-2">
                          <input {...register(`items.${idx}.sku`)} placeholder="SKU"
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500/50 text-[11px]" />
                        </div>
                        <div className="col-span-2">
                          <input {...register(`items.${idx}.category`)} placeholder="Category"
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500/50 text-[11px]" />
                        </div>
                        <div className="col-span-2">
                          <input {...register(`items.${idx}.price`, { valueAsNumber: true })} type="number" placeholder="Price ₹" min="0" step="0.01"
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500/50 text-[11px]" />
                        </div>
                        <div className="col-span-2">
                          <input {...register(`items.${idx}.quantity`, { valueAsNumber: true })} type="number" placeholder="Qty" min="1"
                            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500/50 text-[11px]" />
                        </div>
                        <div className="col-span-1 flex items-center justify-center pt-1.5">
                          <button type="button" onClick={() => remove(idx)}
                            className="p-1.5 rounded-lg bg-red-950/50 text-red-400 hover:bg-red-900/50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Subtotal */}
                        <div className="col-span-12 text-right text-[10px] text-slate-400 font-mono -mt-1 pr-8">
                          Subtotal: <span className="text-white font-semibold">
                            ₹{((Number(watchedItems?.[idx]?.price) || 0) * (Number(watchedItems?.[idx]?.quantity) || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grand Total */}
                  {fields.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 text-right">
                      <span className="text-slate-400 text-xs">Grand Total: </span>
                      <span className="text-xl font-bold text-emerald-400 font-mono ml-2">{fmt(grandTotal)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs">
                    Cancel
                  </button>
                  <button type="button" disabled={isSubmitting}
                    onClick={handleSubmit((d) => onCreateSubmit(d, false))}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-2 disabled:opacity-60 text-xs">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Draft
                  </button>
                  <button type="button" disabled={isSubmitting}
                    onClick={handleSubmit((d) => onCreateSubmit(d, true))}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold flex items-center gap-2 disabled:opacity-60 text-xs">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── View Challan Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewingChallan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">#{viewingChallan.challanNumber}</h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${statusBadge(viewingChallan.status)}`}>
                    {viewingChallan.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setPrintChallan(viewingChallan); setTimeout(handlePrint, 100) }}
                    className="p-2 rounded-xl bg-slate-800 text-blue-400 hover:bg-blue-950" title="Print">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewingChallan(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-5 text-slate-300">
                <div>
                  <p className="text-slate-500 font-medium mb-0.5">Customer</p>
                  <p className="font-semibold text-white">{viewingChallan.customer?.name}</p>
                  <p className="text-slate-400">{viewingChallan.customer?.businessName || viewingChallan.customer?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-medium mb-0.5">Issued Date</p>
                  <p className="text-white">{new Date(viewingChallan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-slate-400">{viewingChallan.createdBy?.name || ''}</p>
                </div>
              </div>

              <table className="w-full text-xs border-collapse mb-5">
                <thead>
                  <tr className="bg-slate-950 border border-slate-800">
                    <th className="p-2.5 text-left text-slate-400 font-semibold">Product</th>
                    <th className="p-2.5 text-left text-slate-400 font-semibold">SKU</th>
                    <th className="p-2.5 text-center text-slate-400 font-semibold">Qty</th>
                    <th className="p-2.5 text-right text-slate-400 font-semibold">Unit Price</th>
                    <th className="p-2.5 text-right text-slate-400 font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewingChallan.items.map((item, idx) => (
                    <tr key={idx} className="border border-slate-800">
                      <td className="p-2.5 text-white font-medium">{item.productName}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{item.sku}</td>
                      <td className="p-2.5 text-center text-white">{item.quantity}</td>
                      <td className="p-2.5 text-right text-slate-300 font-mono">₹{Number(item.price).toLocaleString()}</td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold font-mono">
                        ₹{(Number(item.price) * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-xs">Total ({viewingChallan.items.length} items)</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{fmt(calcChallanTotal(viewingChallan))}</span>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end gap-3">
                {viewingChallan.status === 'DRAFT' && (
                  <button onClick={() => { handleConfirm(viewingChallan); setViewingChallan(null) }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Confirm
                  </button>
                )}
                <button onClick={() => setViewingChallan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deletingChallan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Challan?</h3>
              <p className="text-xs text-slate-400 mb-6">
                Delete <strong className="text-white font-mono">#{deletingChallan.challanNumber}</strong>? This cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setDeletingChallan(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold">Cancel</button>
                <button onClick={handleDelete}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-lg shadow-red-900/30">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Template */}
      {printChallan && (
        <div className="hidden">
          <div ref={printRef}>
            <div className="header">
              <div>
                <h2 style={{ margin: 0, fontSize: 22 }}>FUNDSROOM ERP</h2>
                <p style={{ margin: '4px 0 0', color: '#555', fontSize: 12 }}>Sales & Client Relationship Hub</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>CHALLAN</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: 'monospace' }}>#{printChallan.challanNumber}</p>
                <span className={`badge ${printChallan.status}`}>{printChallan.status}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Bill To:</p>
                <p style={{ margin: '2px 0' }}>{printChallan.customer?.name}</p>
                <p style={{ margin: '2px 0', color: '#555' }}>{printChallan.customer?.businessName || ''}</p>
                <p style={{ margin: '2px 0', color: '#555' }}>{printChallan.customer?.phone || ''}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '2px 0' }}>Date: {new Date(printChallan.createdAt).toLocaleDateString('en-GB')}</p>
                <p style={{ margin: '2px 0' }}>Created By: {printChallan.createdBy?.name || '—'}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {printChallan.items.map((item, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{item.productName}</td>
                    <td>{item.sku}</td>
                    <td>{item.category}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{Number(item.price).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(Number(item.price) * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="total">Grand Total: ₹{calcChallanTotal(printChallan).toLocaleString()}</p>
            <p style={{ fontSize: 11, color: '#888', marginTop: 32, textAlign: 'center' }}>
              Thank you for your business. This is a computer-generated challan.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
