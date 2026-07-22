'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/sidebar'

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-screen bg-[#07090e]">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-[#07090e]">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
