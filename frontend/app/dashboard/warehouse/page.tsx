'use client'

import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Package, AlertCircle, CheckCircle, Clock } from 'lucide-react'

const stockData = [
  { category: 'Electronics', stock: 450, min: 100 },
  { category: 'Accessories', stock: 820, min: 200 },
  { category: 'Cables', stock: 1200, min: 300 },
  { category: 'Peripherals', stock: 350, min: 80 },
]

const statusData = [
  { name: 'In Stock', value: 85 },
  { name: 'Low Stock', value: 10 },
  { name: 'Out of Stock', value: 5 },
]

const COLORS = ['#10b981', '#f59e0b', '#ef4444']

const statCards = [
  { icon: <Package className="w-8 h-8" />, label: 'Total Items', value: '2,820', change: 'In storage' },
  { icon: <AlertCircle className="w-8 h-8" />, label: 'Low Stock', value: '34', change: 'Requires attention' },
  { icon: <CheckCircle className="w-8 h-8" />, label: 'Stock Healthy', value: '85%', change: 'Of inventory' },
  { icon: <Clock className="w-8 h-8" />, label: 'Pending Orders', value: '12', change: 'To be fulfilled' },
]

export default function WarehouseDashboard() {
  return (
    <div>
      <DashboardHeader
        title="Warehouse Dashboard"
        description="Manage inventory and warehouse operations"
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
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-lg w-fit mb-4">
              <div className="text-white">{card.icon}</div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground mb-2">{card.value}</h3>
            <p className="text-xs text-muted-foreground">{card.change}</p>
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
          <h2 className="text-lg font-bold text-foreground mb-4">Stock by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockData}>
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
              <Bar dataKey="stock" fill="var(--color-primary)" />
              <Bar dataKey="min" fill="var(--color-accent)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-6 border border-border shadow-sm"
        >
          <h2 className="text-lg font-bold text-foreground mb-4">Stock Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={{ fill: 'var(--color-foreground)' }} outerRadius={100} fill="#8884d8" dataKey="value">
                {statusData.map((entry, index) => (
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
        <h2 className="text-lg font-bold text-foreground mb-4">Low Stock Alerts</h2>
        <div className="space-y-3">
          {[
            { name: 'USB-C Cable', stock: 8, min: 25, status: 'Critical' },
            { name: 'Power Adapter', stock: 12, min: 20, status: 'Warning' },
            { name: 'Screen Protector', stock: 15, min: 30, status: 'Warning' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-foreground">{item.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-24 h-2 bg-muted rounded-full">
                    <div
                      className={`h-2 rounded-full ${item.status === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ width: `${(item.stock / item.min) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.stock}/{item.min}</span>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded font-semibold ${
                  item.status === 'Critical'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}
              >
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
