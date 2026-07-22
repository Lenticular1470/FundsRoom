'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Phone,
  Mail,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react'
import axiosClient from '@/lib/axiosClient'
import { Customer } from '@/lib/types'

// Zod Schema for Customer Add / Edit
const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().optional(),
  gst: z.string().optional(),
  phone: z.string().min(3, 'Phone number is required'),
  email: z.string().email('Must be a valid email').optional().or(z.literal('')),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  address: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  support: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface ToastState {
  type: 'success' | 'error'
  message: string
}

export default function SalesCustomersPage() {
  const searchParams = useSearchParams()
  const autoOpenNew = searchParams.get('action') === 'new'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(autoOpenNew)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      businessName: '',
      gst: '',
      phone: '',
      email: '',
      type: 'RETAIL',
      status: 'ACTIVE',
      address: '',
      followUpDate: '',
      notes: '',
      support: '',
    },
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axiosClient.get('/customers', {
        params: {
          search,
          status: statusFilter,
          type: typeFilter,
          page,
          limit: 10,
          sortBy,
          sortOrder,
        },
      })
      const data = response.data?.data || response.data
      setCustomers(data.items || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch customer records.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter, page, sortBy, sortOrder])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const openAddModal = () => {
    setEditingCustomer(null)
    setApiError(null)
    reset({
      name: '',
      businessName: '',
      gst: '',
      phone: '',
      email: '',
      type: 'RETAIL',
      status: 'ACTIVE',
      address: '',
      followUpDate: '',
      notes: '',
      support: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust)
    setApiError(null)
    setValue('name', cust.name)
    setValue('businessName', cust.businessName || '')
    setValue('gst', cust.gst || '')
    setValue('phone', cust.phone)
    setValue('email', cust.email || '')
    setValue('type', cust.type || 'RETAIL')
    setValue('status', cust.status || 'ACTIVE')
    setValue('address', cust.address || '')
    setValue(
      'followUpDate',
      cust.followUpDate ? new Date(cust.followUpDate).toISOString().split('T')[0] : ''
    )
    setValue('notes', cust.notes || '')
    setValue('support', cust.support || '')
    setIsModalOpen(true)
  }

  const onSubmitForm = async (data: CustomerFormData) => {
    setApiError(null)
    try {
      if (editingCustomer) {
        await axiosClient.put(`/customers/${editingCustomer.id}`, data)
        showToast('success', 'Customer record updated successfully!')
      } else {
        await axiosClient.post('/customers', data)
        showToast('success', 'New customer created successfully!')
      }
      setIsModalOpen(false)
      fetchCustomers()
    } catch (err: any) {
      const msg = err.message || 'Failed to save customer details.'
      setApiError(msg)
      showToast('error', msg)
    }
  }

  const handleDelete = async () => {
    if (!deletingCustomer) return
    try {
      await axiosClient.delete(`/customers/${deletingCustomer.id}`)
      showToast('success', `Customer '${deletingCustomer.name}' deleted successfully!`)
      setDeletingCustomer(null)
      fetchCustomers()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete customer.')
    }
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
                : 'bg-red-950 border-red-800 text-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Customer Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage relationships, follow-up dates, and contact details
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name, business, phone..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="LEAD">LEAD</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="ALL">All Customer Types</option>
            <option value="RETAIL">RETAIL</option>
            <option value="WHOLESALE">WHOLESALE</option>
            <option value="DISTRIBUTOR">DISTRIBUTOR</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{customers.length}</span> of{' '}
          <span className="text-white font-bold">{total}</span> customers
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Business / Phone</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th
                  onClick={() => toggleSort('followUpDate')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Follow-up Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <span>Fetching live customer records...</span>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-semibold text-white">
                      {cust.name}
                      {cust.gst && (
                        <p className="text-[10px] text-slate-500 font-mono">GST: {cust.gst}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-200 font-medium">{cust.businessName || '-'}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" /> {cust.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {cust.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{cust.email}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                          cust.type === 'DISTRIBUTOR'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : cust.type === 'WHOLESALE'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {cust.type || 'RETAIL'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : cust.status === 'LEAD'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {cust.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-[11px]">
                      {cust.followUpDate ? (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(cust.followUpDate).toLocaleDateString('en-GB')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingCustomer(cust)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:bg-emerald-950 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(cust)}
                          className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-950 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No customers matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-400" />
                  {editingCustomer ? 'Edit Customer Record' : 'Add New Customer'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {apiError && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Customer Name *</label>
                    <input
                      {...register('name')}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {errors.name && <p className="text-red-400 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Business Name</label>
                    <input
                      {...register('businessName')}
                      placeholder="TechCorp Solutions"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Phone Number *</label>
                    <input
                      {...register('phone')}
                      placeholder="+91 9876543210"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {errors.phone && <p className="text-red-400 mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Work Email</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="rajesh@techcorp.com"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                    />
                    {errors.email && <p className="text-red-400 mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GST Number</label>
                    <input
                      {...register('gst')}
                      placeholder="27AAACG1234F1Z5"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Follow-up Date</label>
                    <input
                      {...register('followUpDate')}
                      type="date"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Customer Type</label>
                    <select
                      {...register('type')}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                    >
                      <option value="RETAIL">RETAIL</option>
                      <option value="WHOLESALE">WHOLESALE</option>
                      <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Account Status</label>
                    <select
                      {...register('status')}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="LEAD">LEAD</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Address</label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    placeholder="Enter full address..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Notes & Preferences</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    placeholder="Key account notes..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold flex items-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingCustomer ? 'Update Customer' : 'Create Customer'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Customer Details Modal */}
      <AnimatePresence>
        {viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-white">{viewingCustomer.name}</h3>
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-400">Business Name:</strong>{' '}
                  {viewingCustomer.businessName || 'N/A'}
                </p>
                <p>
                  <strong className="text-slate-400">Phone:</strong> {viewingCustomer.phone}
                </p>
                <p>
                  <strong className="text-slate-400">Email:</strong> {viewingCustomer.email || 'N/A'}
                </p>
                <p>
                  <strong className="text-slate-400">GST:</strong> {viewingCustomer.gst || 'N/A'}
                </p>
                <p>
                  <strong className="text-slate-400">Type:</strong> {viewingCustomer.type}
                </p>
                <p>
                  <strong className="text-slate-400">Status:</strong> {viewingCustomer.status}
                </p>
                <p>
                  <strong className="text-slate-400">Address:</strong>{' '}
                  {viewingCustomer.address || 'N/A'}
                </p>
                <p>
                  <strong className="text-slate-400">Follow-up Date:</strong>{' '}
                  {viewingCustomer.followUpDate
                    ? new Date(viewingCustomer.followUpDate).toLocaleDateString('en-GB')
                    : 'N/A'}
                </p>
                <p>
                  <strong className="text-slate-400">Notes:</strong> {viewingCustomer.notes || 'N/A'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-right">
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Delete Customer?</h3>
              <p className="text-xs text-slate-400 mb-6">
                Are you sure you want to delete{' '}
                <strong className="text-white">{deletingCustomer.name}</strong>? This action cannot
                be undone.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeletingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-lg shadow-red-900/30"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
