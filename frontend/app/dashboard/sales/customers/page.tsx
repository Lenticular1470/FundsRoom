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
  FileSpreadsheet,
} from 'lucide-react'
import axiosClient from '@/lib/axiosClient'
import { Customer } from '@/lib/types'
import SalesHeader from '@/components/sales-header'

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
    const formattedFollowUp = cust.followUpDate
      ? new Date(cust.followUpDate).toISOString().split('T')[0]
      : ''
    reset({
      name: cust.name,
      businessName: cust.businessName || '',
      gst: cust.gst || '',
      phone: cust.phone,
      email: cust.email || '',
      type: cust.type,
      status: cust.status,
      address: cust.address || '',
      followUpDate: formattedFollowUp,
      notes: cust.notes || '',
      support: cust.support || '',
    })
    setIsModalOpen(true)
  }

  const onSubmitForm = async (data: CustomerFormData) => {
    setApiError(null)
    try {
      if (editingCustomer) {
        await axiosClient.put(`/customers/${editingCustomer.id}`, data)
        showToast('success', `Customer "${data.name}" updated successfully.`)
      } else {
        await axiosClient.post('/customers', data)
        showToast('success', `Customer "${data.name}" created successfully.`)
      }
      setIsModalOpen(false)
      fetchCustomers()
    } catch (err: any) {
      setApiError(err?.message || 'Operation failed. Please check form details.')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return
    try {
      await axiosClient.delete(`/customers/${deletingCustomer.id}`)
      showToast('success', `Customer "${deletingCustomer.name}" deleted.`)
      setDeletingCustomer(null)
      fetchCustomers()
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete customer.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Sales Header */}
      <SalesHeader
        title="Customer Directory & CRM"
        subtitle="Manage client databases, contact info, and lead notes"
        searchQuery={search}
        setSearchQuery={setSearch}
        onRefresh={fetchCustomers}
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

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Customer Directory & CRM</h2>
          <p className="text-xs text-slate-600 font-medium">
            Manage client databases, contact info, and lead notes
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/25 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </motion.button>
      </div>

      {/* Filters Bar & Table Container */}
      <div className="bg-white rounded-3xl border border-[#E8DFC9] shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-[#F0E8DD] bg-[#FAF7F2]/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-amber-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-[#E8DFC9] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
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
                className="px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DFC9] text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="LEAD">Lead</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DFC9] text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="ALL">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Total: <span className="text-slate-900 font-extrabold">{total}</span> customers
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#F0E8DD] bg-[#FAF7F2] text-slate-500 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-4 px-6">NAME</th>
                <th className="py-4 px-6">BUSINESS</th>
                <th className="py-4 px-6">MOBILE & EMAIL</th>
                <th className="py-4 px-6">GST</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6">FOLLOW UP</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8DD]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Fetching live database customers...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No customer records match your filter criteria.
                  </td>
                </tr>
              ) : (
                customers.map((cust, idx) => (
                  <motion.tr
                    key={cust.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    {/* NAME */}
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      {cust.name}
                    </td>

                    {/* BUSINESS */}
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {cust.businessName || '—'}
                    </td>

                    {/* MOBILE & EMAIL */}
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      <span>{cust.phone}</span>
                      {cust.email && <span className="text-slate-400 mx-1.5">|</span>}
                      {cust.email && <span className="text-slate-700">{cust.email}</span>}
                    </td>

                    {/* GST */}
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      {cust.gst || '—'}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : cust.status === 'LEAD'
                            ? 'bg-yellow-400/30 text-yellow-950 border-yellow-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          cust.status === 'ACTIVE' ? 'bg-emerald-600' : cust.status === 'LEAD' ? 'bg-yellow-600' : 'bg-slate-400'
                        }`} />
                        {cust.status}
                      </span>
                    </td>

                    {/* FOLLOW UP */}
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {cust.followUpDate
                        ? new Date(cust.followUpDate).toISOString().split('T')[0]
                        : 'None'}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => setViewingCustomer(cust)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-amber-100/60 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCustomer(cust)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F0E8DD] bg-[#FAF7F2]/50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E8DFC9] bg-white text-slate-700 disabled:opacity-40 hover:bg-amber-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E8DFC9] bg-white text-slate-700 disabled:opacity-40 hover:bg-amber-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8DFC9] shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-[#F0E8DD] bg-[#FAF7F2] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingCustomer ? 'Edit Customer Record' : 'Add New Customer'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Save customer contact info directly to the live database
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-amber-100/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {apiError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('name')}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Business / Enterprise Name</label>
                    <input
                      {...register('businessName')}
                      placeholder="e.g. TechCorp Solutions Pvt Ltd"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Phone / Mobile <span className="text-rose-500">*</span>
                    </label>
                    <input
                      {...register('phone')}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    {errors.phone && <p className="text-rose-500 text-[11px] mt-1">{errors.phone.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address</label>
                    <input
                      {...register('email')}
                      placeholder="e.g. rajesh@techcorp.in"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    {errors.email && <p className="text-rose-500 text-[11px] mt-1">{errors.email.message}</p>}
                  </div>

                  {/* GST */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">GST Number</label>
                    <input
                      {...register('gst')}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-mono font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none uppercase"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Status</label>
                    <select
                      {...register('status')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="LEAD">LEAD</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  {/* Customer Type */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Customer Type</label>
                    <select
                      {...register('type')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-bold focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="RETAIL">RETAIL</option>
                      <option value="WHOLESALE">WHOLESALE</option>
                      <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    </select>
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      {...register('followUpDate')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lead / Interaction Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={2}
                    placeholder="Enter recent call notes or key details..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DFC9] text-slate-900 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Submit buttons */}
                <div className="pt-4 border-t border-[#F0E8DD] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E8DFC9] text-slate-700 font-bold hover:bg-amber-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-bold shadow-md shadow-amber-400/25 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Plus className="w-4 h-4" />}
                    <span>{editingCustomer ? 'Update Customer' : 'Save to Database'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8DFC9] p-6 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Customer?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <span className="font-bold text-slate-800">{deletingCustomer.name}</span>?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFC9] text-slate-700 font-bold hover:bg-amber-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Drawer / Modal */}
      <AnimatePresence>
        {viewingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#E8DFC9] shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E8DD]">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{viewingCustomer.name}</h3>
                  <p className="text-xs text-amber-700 font-bold">{viewingCustomer.businessName || 'Individual Client'}</p>
                </div>
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-amber-100/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-amber-50">
                  <span className="font-bold text-slate-500">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingCustomer.phone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-50">
                  <span className="font-bold text-slate-500">Email:</span>
                  <span className="font-mono text-slate-900">{viewingCustomer.email || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-50">
                  <span className="font-bold text-slate-500">GST:</span>
                  <span className="font-mono font-bold text-slate-900">{viewingCustomer.gst || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-50">
                  <span className="font-bold text-slate-500">Type / Status:</span>
                  <span className="font-bold text-amber-800">{viewingCustomer.type} | {viewingCustomer.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-50">
                  <span className="font-bold text-slate-500">Follow-up Date:</span>
                  <span className="font-bold text-slate-900">
                    {viewingCustomer.followUpDate ? new Date(viewingCustomer.followUpDate).toLocaleDateString('en-IN') : 'None'}
                  </span>
                </div>
                {viewingCustomer.notes && (
                  <div className="pt-2">
                    <span className="font-bold text-slate-500 block mb-1">Notes:</span>
                    <p className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9] text-slate-800 font-medium">
                      {viewingCustomer.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#F0E8DD] text-right">
                <button
                  onClick={() => setViewingCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-500"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
