'use client'

import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, CreditCard, FileText } from 'lucide-react'

const revenueData = [
  { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000 },
  { month: 'Feb', revenue: 52000, expenses: 31000, profit: 21000 },
  { month: 'Mar', revenue: 48000, expenses: 29000, profit: 19000 },
  { month: 'Apr', revenue: 61000, expenses: 35000, profit: 26000 },
  { month: 'May', revenue: 67000, expenses: 38000, profit: 29000 },
  { month: 'Jun', revenue: 72000, expenses: 40000, profit: 32000 },
]

const statCards = [
  { icon: <DollarSign className="w-8 h-8" />, label: 'Total Revenue', value: '$397,000', change: '+12% YoY' },
  { icon: <TrendingUp className="w-8 h-8" />, label: 'Total Profit', value: '$144,000', change: '+18% from last quarter' },
  { icon: <CreditCard className="w-8 h-8" />, label: 'Outstanding', value: '$24,500', change: '8 invoices pending' },
  { icon: <FileText className="w-8 h-8" />, label: 'Transactions', value: '456', change: 'This month' },
]

export default function AccountsDashboard() {
  return (
    <div>
      <DashboardHeader
        title="Accounts & Finance"
        description="Monitor financial performance and transactions"
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
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-lg w-fit mb-4">
              <div className="text-white">{card.icon}</div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground mb-2">{card.value}</h3>
            <p className="text-xs text-green-600 dark:text-green-400">{card.change}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl p-6 border border-border shadow-sm mb-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Financial Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
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
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stackId="1"
              stroke="var(--color-accent)"
              fill="var(--color-accent)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-xl p-6 border border-border shadow-sm mb-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Profit Margin Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData}>
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
            <Line
              type="monotone"
              dataKey="profit"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--color-primary)', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-xl p-6 border border-border shadow-sm"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Invoices</h2>
        <div className="space-y-3">
          {[
            { id: 'INV-001', customer: 'Tech Corp', amount: '$2,500', status: 'Paid', date: '2024-07-20' },
            { id: 'INV-002', customer: 'Design Inc', amount: '$1,800', status: 'Pending', date: '2024-07-19' },
            { id: 'INV-003', customer: 'Business Ltd', amount: '$3,200', status: 'Paid', date: '2024-07-18' },
            { id: 'INV-004', customer: 'Global Solutions', amount: '$2,100', status: 'Overdue', date: '2024-07-10' },
          ].map((invoice, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-semibold text-foreground">{invoice.id}</p>
                <p className="text-sm text-muted-foreground">{invoice.customer}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-foreground">{invoice.amount}</p>
                  <p className="text-xs text-muted-foreground">{invoice.date}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    invoice.status === 'Paid'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : invoice.status === 'Pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
