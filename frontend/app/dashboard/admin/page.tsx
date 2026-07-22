'use client'

import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, Package, ShoppingCart, TrendingUp } from 'lucide-react'

const chartData = [
  { name: 'Jan', sales: 4000, revenue: 2400 },
  { name: 'Feb', sales: 3000, revenue: 1398 },
  { name: 'Mar', sales: 2000, revenue: 9800 },
  { name: 'Apr', sales: 2780, revenue: 3908 },
  { name: 'May', sales: 1890, revenue: 4800 },
  { name: 'Jun', sales: 2390, revenue: 3800 },
]

const pieData = [
  { name: 'Product A', value: 400 },
  { name: 'Product B', value: 300 },
  { name: 'Product C', value: 300 },
  { name: 'Product D', value: 200 },
]

const COLORS = ['#b45309', '#d97706', '#92400e', '#fbbf24']

const statCards = [
  {
    icon: <Users className="w-8 h-8" />,
    label: 'Total Customers',
    value: '1,245',
    change: '+12%',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: <Package className="w-8 h-8" />,
    label: 'Products',
    value: '342',
    change: '+8%',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: <ShoppingCart className="w-8 h-8" />,
    label: 'Orders',
    value: '856',
    change: '+15%',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    label: 'Revenue',
    value: '$45.2K',
    change: '+23%',
    color: 'from-purple-500 to-pink-600',
  },
]

export default function AdminDashboard() {
  return (
    <div>
      <DashboardHeader
        title="Admin Dashboard"
        description="Overview of your business metrics and key performance indicators"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <h3 className="text-2xl font-bold text-foreground mb-2">{card.value}</h3>
            <p className="text-xs text-green-600 dark:text-green-400">{card.change} from last month</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card rounded-xl p-6 border border-border shadow-sm"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Sales & Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="sales" fill="var(--color-primary)" />
              <Bar dataKey="revenue" fill="var(--color-accent)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-6 border border-border shadow-sm"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Product Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={{ fill: 'var(--color-foreground)' }} outerRadius={100} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-xl p-6 border border-border shadow-sm"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Activities</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">Activity {i + 1}</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <div className="text-sm text-primary">View</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
