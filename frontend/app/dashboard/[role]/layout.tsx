'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/sidebar'

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { role: string }
}) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-background">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
