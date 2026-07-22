'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Customer } from '@/lib/types'
import { Plus, Search, Edit2, Trash2, Eye, Loader2 } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import axiosClient from '@/lib/axiosClient'

interface CustomersApiResult {
  items: Customer[]
  total: number
  page: number
  limit: number
}

const mapCustomer = (customer: any): Customer => ({
  id: customer.id,
  name: customer.name,
  email: customer.email || 'N/A',
  phone: customer.phone || 'N/A',
  company: customer.businessName || customer.business_name || customer.company || 'N/A',
  address: customer.address || '',
  city: customer.city || 'N/A',
  state: customer.state || '',
  zipCode: customer.zipCode || customer.zip_code || '',
  country: customer.country || 'N/A',
  type: customer.type || 'WHOLESALE',
  status: customer.status || 'ACTIVE',
  createdAt: customer.created_at || customer.createdAt || new Date().toISOString(),
})

export default function CustomersPage() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
  })

  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<CustomersApiResult>('/customers', token)
      setCustomers(data.items.map(mapCustomer))
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch customers from backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [token])

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone) {
      alert('Please fill in Customer Name and Phone number.')
      return
    }
    setSubmitting(true)
    try {
      await apiPost(
        '/customers',
        {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          businessName: form.company || undefined,
          type: 'WHOLESALE',
          status: 'ACTIVE',
        },
        token
      )
      setShowModal(false)
      setForm({ name: '', email: '', company: '', phone: '' })
      await loadCustomers()
    } catch (err: any) {
      alert(err?.message || 'Failed to create customer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await axiosClient.delete(`/customers/${id}`)
      await loadCustomers()
    } catch (err: any) {
      alert(err?.message || 'Failed to delete customer.')
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <DashboardHeader title="Customers" description="Manage and track your customer database" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedCustomer(null)
            setForm({ name: '', email: '', company: '', phone: '' })
            setShowModal(true)
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-md transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </motion.button>
      </motion.div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">City</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> Loading customers...
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, idx) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{customer.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{customer.company}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{customer.city}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowModal(true)
                          }}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-amber-500"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Customer / Details Modal */}
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
            <h2 className="text-xl font-bold text-white mb-4">
              {selectedCustomer ? 'Customer Details' : 'New Customer'}
            </h2>
            {selectedCustomer ? (
              <div className="space-y-3 mb-6 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="font-semibold text-white">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-semibold text-white">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Company</p>
                  <p className="font-semibold text-white">{selectedCustomer.company}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-semibold text-white">{selectedCustomer.phone}</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Customer Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0e0c09] text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
