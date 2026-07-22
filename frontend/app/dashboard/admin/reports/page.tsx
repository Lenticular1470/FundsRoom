'use client'

import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, FileText } from 'lucide-react'

const salesData = [
  { month: 'Jan', sales: 4000, target: 3500 },
  { month: 'Feb', sales: 3000, target: 3500 },
  { month: 'Mar', sales: 5000, target: 4000 },
  { month: 'Apr', sales: 4500, target: 4500 },
  { month: 'May', sales: 6200, target: 5000 },
  { month: 'Jun', sales: 5800, target: 5500 },
]

const categoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Accessories', value: 25 },
  { name: 'Services', value: 20 },
  { name: 'Other', value: 20 },
]

const COLORS = ['#d97706', '#059669', '#0891b2', '#8b5cf6']

const reports = [
  {
    id: 1,
    title: 'Monthly Sales Report',
    type: 'Sales',
    date: '2024-07-22',
    description: 'Comprehensive sales analysis for June 2024',
  },
  {
    id: 2,
    title: 'Inventory Status Report',
    type: 'Inventory',
    date: '2024-07-21',
    description: 'Current stock levels and movements',
  },
  {
    id: 3,
    title: 'Customer Analysis',
    type: 'Customer',
    date: '2024-07-20',
    description: 'Customer segmentation and activity analysis',
  },
  {
    id: 4,
    title: 'Financial Summary',
    type: 'Financial',
    date: '2024-07-19',
    description: 'Revenue, expenses, and profitability metrics',
  },
]

export default function ReportsPage() {
  return (
    <div>
      <DashboardHeader
        title="Reports & Analytics"
        description="View detailed business analytics and generate reports"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
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
              <Line
                type="monotone"
                dataKey="sales"
                stroke="var(--color-primary)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="var(--color-accent)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={{ fill: 'var(--color-foreground)' }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
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
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-6 border border-border shadow-sm mb-8"
      >
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Reports</h2>
        <div className="space-y-3">
          {reports.map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-primary/10 rounded-lg mt-1">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{report.title}</h3>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {report.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{report.date}</span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
              >
                <Download className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-lg transition-shadow"
      >
        Generate New Report
      </motion.button>
    </div>
  )
}
