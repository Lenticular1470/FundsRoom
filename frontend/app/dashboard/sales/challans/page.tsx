'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileSpreadsheet,
  Plus,
  Search,
  Printer,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Building,
  User,
  Package,
} from 'lucide-react'
import axiosClient from '@/lib/axiosClient'
import SalesHeader from '@/components/sales-header'
import { Customer } from '@/lib/types'

interface ChallanItem {
  id?: string
  productName: string
  sku: string
  category: string
  price: number
  quantity: number
}

interface Challan {
  id: string
  challanNumber: string
  customerId: string
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  customer?: Customer
  items: ChallanItem[]
}

export default function SalesChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [viewingChallan, setViewingChallan] = useState<Challan | null>(null)
  const [printingChallan, setPrintingChallan] = useState<Challan | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Form State for New Challan
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newChallanNumber, setNewChallanNumber] = useState('')
  const [lineItems, setLineItems] = useState<Array<{ productName: string; sku: string; price: number; quantity: number }>>([
    { productName: 'ERP System License', sku: 'SKU-ERP-001', price: 45000, quantity: 2 },
  ])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchChallans = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get('/challans')
      const data = response.data?.data || response.data
      setChallans(Array.isArray(data) ? data : data.items || [])
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch sales challans.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axiosClient.get('/customers', { params: { limit: 100 } })
      const data = response.data?.data || response.data
      setCustomers(data.items || [])
      if (data.items && data.items.length > 0) {
        setSelectedCustomerId(data.items[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchChallans()
    fetchCustomers()
    setNewChallanNumber(`SCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
  }, [fetchChallans, fetchCustomers])

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerId) {
      setApiError('Please select a valid customer.')
      return
    }

    try {
      const payload = {
        challanNumber: newChallanNumber,
        customerId: selectedCustomerId,
        status: 'DRAFT',
        items: lineItems.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          category: 'General',
          price: item.price,
          quantity: Number(item.quantity),
        })),
      }

      await axiosClient.post('/challans', payload)
      showToast('success', `Challan ${newChallanNumber} created successfully!`)
      setIsCreateModalOpen(false)
      fetchChallans()
    } catch (err: any) {
      setApiError(err?.message || 'Failed to create sales challan.')
    }
  }

  const handleConfirmChallan = async (id: string, challanNumber: string) => {
    try {
      await axiosClient.put(`/challans/${id}`, { status: 'CONFIRMED' })
      showToast('success', `Challan ${challanNumber} confirmed successfully.`)
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to confirm challan.')
    }
  }

  const handleCancelChallan = async (id: string, challanNumber: string) => {
    try {
      await axiosClient.put(`/challans/${id}`, { status: 'CANCELLED' })
      showToast('success', `Challan ${challanNumber} cancelled.`)
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update challan.')
    }
  }

  const handleDeleteChallan = async (id: string) => {
    try {
      await axiosClient.delete(`/challans/${id}`)
      showToast('success', 'Challan deleted.')
      fetchChallans()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete challan.')
    }
  }

  const filteredChallans = challans.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.challanNumber.toLowerCase().includes(q) ||
      (c.customer && c.customer.name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <SalesHeader
        title="Sales Challans Module"
        subtitle="Generate, confirm, print, and track delivery challans"
        searchQuery={search}
        setSearchQuery={setSearch}
        onRefresh={fetchChallans}
        loading={loading}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-rose-100 border-rose-300 text-rose-900'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-amber-700" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Sales Challans Module</h2>
          <p className="text-xs text-slate-600 font-medium">
            Generate, confirm, print, and track delivery challans
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setNewChallanNumber(`SCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`)
            setIsCreateModalOpen(true)
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/25 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Challan</span>
        </motion.button>
      </div>

      {/* Challan Table Container */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F0E8DD] bg-[#FAF7F2]/50 flex items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-amber-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challans or customers..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-[#E8DFC9] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Records: <span className="text-slate-900 font-extrabold">{filteredChallans.length}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#F0E8DD] bg-[#FAF7F2] text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-4 px-6">CHALLAN NUMBER</th>
                <th className="py-4 px-6">CUSTOMER</th>
                <th className="py-4 px-6">TOTAL QTY</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6">DATE</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8DD]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading real sales challans from database...</span>
                  </td>
                </tr>
              ) : filteredChallans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No sales challans recorded in database.
                  </td>
                </tr>
              ) : (
                filteredChallans.map((c, idx) => {
                  const totalQty = c.items ? c.items.reduce((acc, item) => acc + item.quantity, 0) : 0
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      {/* CHALLAN NUMBER */}
                      <td className="py-4 px-6 font-mono font-extrabold text-slate-900">
                        {c.challanNumber}
                      </td>

                      {/* CUSTOMER */}
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {c.customer?.name || 'Customer Record'}
                      </td>

                      {/* TOTAL QTY */}
                      <td className="py-4 px-6 text-slate-700 font-semibold">
                        {totalQty} items
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            c.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : c.status === 'DRAFT'
                              ? 'bg-yellow-400/30 text-yellow-950 border-yellow-400'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'CONFIRMED' ? 'bg-emerald-600' : c.status === 'DRAFT' ? 'bg-yellow-600' : 'bg-rose-500'
                          }`} />
                          {c.status}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          month: 'numeric',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 text-right space-x-1.5">
                        {/* Print Button */}
                        <button
                          onClick={() => setPrintingChallan(c)}
                          className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-amber-100/60 transition-colors"
                          title="Print Challan"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Confirm Button */}
                        {c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleConfirmChallan(c.id, c.challanNumber)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/60 transition-colors"
                            title="Confirm Challan"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cancel Button */}
                        {c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleCancelChallan(c.id, c.challanNumber)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 transition-colors"
                            title="Cancel Challan"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteChallan(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Challan Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8DFC9] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#F0E8DD] bg-[#FAF7F2] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Create Sales Delivery Challan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Issue new delivery challan to database</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-amber-100/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateChallan} className="p-6 space-y-4 text-xs">
                {apiError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Challan Number</label>
                    <input
                      type="text"
                      value={newChallanNumber}
                      onChange={(e) => setNewChallanNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Customer</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      required
                    >
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} {cust.businessName ? `(${cust.businessName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line Item Inputs */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[#F0E8DD] pb-2">
                    <span className="font-extrabold text-slate-900">Line Items</span>
                    <button
                      type="button"
                      onClick={() => setLineItems([...lineItems, { productName: 'CRM Pro Module', sku: 'SKU-CRM-002', price: 25000, quantity: 1 }])}
                      className="text-amber-700 font-bold text-xs hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  {lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DFC9]">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => {
                            const copy = [...lineItems]
                            copy[idx].productName = e.target.value
                            setLineItems(copy)
                          }}
                          placeholder="Product Name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E8DFC9] font-medium text-slate-900"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const copy = [...lineItems]
                            copy[idx].price = Number(e.target.value)
                            setLineItems(copy)
                          }}
                          placeholder="Price"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E8DFC9] font-medium text-slate-900"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...lineItems]
                            copy[idx].quantity = Number(e.target.value)
                            setLineItems(copy)
                          }}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E8DFC9] font-bold text-slate-900"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#F0E8DD] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E8DFC9] text-slate-700 font-bold hover:bg-amber-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold shadow-md shadow-amber-400/25 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Delivery Challan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Challan Modal */}
      <AnimatePresence>
        {printingChallan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8DFC9] shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-6"
            >
              <div className="border-b border-[#F0E8DD] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">DELIVERY CHALLAN</h2>
                  <p className="text-xs text-amber-700 font-bold">Fundsroom ERP & CRM</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-slate-900">{printingChallan.challanNumber}</span>
                  <p className="text-[10px] text-slate-500">
                    Date: {new Date(printingChallan.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DFC9] space-y-1 text-xs text-slate-800">
                <p className="font-bold text-slate-500 text-[10px] uppercase">CUSTOMER RECIPIENT:</p>
                <p className="font-extrabold text-slate-900 text-sm">{printingChallan.customer?.name}</p>
                <p className="font-medium text-slate-700">{printingChallan.customer?.businessName || 'Individual Customer'}</p>
                <p className="font-mono text-slate-600">{printingChallan.customer?.phone} | {printingChallan.customer?.email}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                <p className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Item Specifications:</p>
                <div className="border border-[#E8DFC9] rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAF7F2] text-slate-500 font-bold border-b border-[#E8DFC9]">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E8DD]">
                      {printingChallan.items && printingChallan.items.map((item, i) => (
                        <tr key={i}>
                          <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                          <td className="p-3 text-right font-mono text-slate-700">₹{item.price}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F0E8DD] flex items-center justify-between">
                <button
                  onClick={() => setPrintingChallan(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFC9] text-slate-700 font-bold hover:bg-amber-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print()
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
