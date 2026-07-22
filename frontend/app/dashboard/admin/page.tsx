'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Users,
  Package,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface DashboardData {
  todaysSales: number
  monthlySales: number
  todaysLeads: number
  activeClients: number
  followUpsCount: number
  pendingChallans: number
  totalCustomers: number
  totalProducts: number
  salesTrend: Array<{ label: string; revenue: number; orders: number }>
  upcomingFollowUps: Array<{
    id: string
    name: string
    businessName: string | null
    phone: string
    followUpDate: string | null
    status: string
  }>
}

interface ChallanStats {
  total: number
  draft: number
  confirmed: number
  cancelled: number
}

const COLORS = ['#d97706', '#b45309', '#92400e', '#fbbf24']

export default function AdminDashboard() {
  const { token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [challanStats, setChallanStats] = useState<ChallanStats>({
    total: 0,
    draft: 0,
    confirmed: 0,
    cancelled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const [dashRes, challanRes] = await Promise.all([
          apiGet<DashboardData>('/dashboard', token),
          apiGet<{ items: Array<{ status: string }>; total: number }>('/challans', token),
        ])
        setData(dashRes)

        const items = challanRes.items || []
        setChallanStats({
          total: challanRes.total || items.length,
          draft: items.filter((c) => c.status === 'DRAFT').length,
          confirmed: items.filter((c) => c.status === 'CONFIRMED').length,
          cancelled: items.filter((c) => c.status === 'CANCELLED').length,
        })
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`
    return `₹${val.toFixed(0)}`
  }

  const statCards = data
    ? [
        {
          icon: <Users className="w-6 h-6" />,
          label: 'Total Customers',
          value: data.totalCustomers,
          sub: `${data.activeClients} active`,
          color: 'from-blue-500 to-cyan-600',
        },
        {
          icon: <Package className="w-6 h-6" />,
          label: 'Total Products',
          value: data.totalProducts,
          sub: 'Catalogued SKUs',
          color: 'from-green-500 to-emerald-600',
        },
        {
          icon: <TrendingUp className="w-6 h-6" />,
          label: "Today's Sales",
          value: formatCurrency(data.todaysSales),
          sub: `Monthly: ${formatCurrency(data.monthlySales)}`,
          color: 'from-amber-500 to-orange-600',
        },
        {
          icon: <AlertTriangle className="w-6 h-6" />,
          label: 'Pending Challans',
          value: data.pendingChallans,
          sub: 'Drafts awaiting confirm',
          color: 'from-purple-500 to-pink-600',
        },
      ]
    : []

  const challanCards = [
    {
      icon: <FileText className="w-6 h-6 text-amber-600" />,
      label: 'Total Sales Challans',
      value: challanStats.total,
      bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
    },
    {
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      label: 'Draft Challans',
      value: challanStats.draft,
      bg: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      label: 'Confirmed Challans',
      value: challanStats.confirmed,
      bg: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
    },
    {
      icon: <XCircle className="w-6 h-6 text-red-600" />,
      label: 'Cancelled Challans',
      value: challanStats.cancelled,
      bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
    },
  ]

  return (
    <div>
      <DashboardHeader
        title="Admin Dashboard"
        description="Super Admin Control Center — real-time overview of your ERP & CRM"
      />

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading dashboard data...
        </div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg w-fit mb-4`}>
                  <div className="text-white">{card.icon}</div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                <h3 className="text-2xl font-bold text-foreground mb-1">{card.value}</h3>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Challan Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {challanCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.08 }}
                className={`rounded-xl p-5 border ${card.bg} flex items-center gap-4`}
              >
                <div className="p-2 bg-white/60 rounded-lg">{card.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2 bg-card rounded-xl p-6 border border-border shadow-sm"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Revenue & Monthly Sales Trend</h2>
              {data && data.salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.salesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      stroke="var(--color-muted-foreground)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => v.split(' ')[0]}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                      formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#d97706" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" fill="#b45309" name="Orders" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No sales trend data yet.
                </div>
              )}
            </motion.div>

            {/* Challan Distribution Pie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Challan Distribution</h2>
              {challanStats.total > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Draft', value: challanStats.draft },
                        { name: 'Confirmed', value: challanStats.confirmed },
                        { name: 'Cancelled', value: challanStats.cancelled },
                      ].filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      dataKey="value"
                    >
                      {['#d97706', '#22c55e', '#ef4444'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No challan data yet.
                </div>
              )}
            </motion.div>
          </div>

          {/* Upcoming Follow-ups */}
          {data && data.upcomingFollowUps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-card rounded-xl p-6 border border-border shadow-sm"
            >
              <h2 className="text-lg font-bold text-foreground mb-4">Upcoming Follow-ups</h2>
              <div className="divide-y divide-border">
                {data.upcomingFollowUps.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                        {fu.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{fu.name}</p>
                        <p className="text-xs text-muted-foreground">{fu.businessName || fu.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          fu.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {fu.status}
                      </span>
                      {fu.followUpDate && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(fu.followUpDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
