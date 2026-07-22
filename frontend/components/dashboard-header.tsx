'use client'

import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'

interface DashboardHeaderProps {
  title: string
  description?: string
}

export default function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user } = useAuth()

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening'

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-primary/60 mb-2">
            {greeting}, {user?.name}
          </p>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{now.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          <p className="text-sm text-muted-foreground">{now.toLocaleDateString()}</p>
        </div>
      </div>
    </motion.div>
  )
}
