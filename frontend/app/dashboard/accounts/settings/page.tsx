'use client'

import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

export default function AccountsSettingsPage() {
  return (
    <div>
      <DashboardHeader title="Settings" description="Manage account preferences" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-12 border border-border shadow-sm text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <Settings className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground mb-6">Customize your account settings</p>
      </motion.div>
    </div>
  )
}
