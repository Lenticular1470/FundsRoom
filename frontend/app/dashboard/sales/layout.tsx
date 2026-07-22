'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import { useAuth } from '@/lib/auth-context'

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6F0]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex bg-[#FAF6F0] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-[#FAF6F0] p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
