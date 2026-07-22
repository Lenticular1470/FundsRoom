'use client'

import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DashboardHeaderProps {
  title: string
  description?: string
}

export default function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const { user } = useAuth()
  const [dateStr, setDateStr] = useState('')
  const [weekdayStr, setWeekdayStr] = useState('')
  const [greeting, setGreeting] = useState('Hello')

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    setGreeting(hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening')
    setWeekdayStr(now.toLocaleDateString('en-US', { weekday: 'long' }))
    setDateStr(now.toLocaleDateString('en-IN'))
  }, [])

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
          <p className="text-2xl font-bold text-primary">{weekdayStr}</p>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
      </div>
    </motion.div>
  )
}
