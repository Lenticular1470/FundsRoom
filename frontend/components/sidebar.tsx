'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { UserRole } from '@/lib/types'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  roles?: UserRole[]
}

const getNavItems = (role: UserRole): NavItem[] => {
  const baseItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', href: `/dashboard/${role}` },
  ]

  const roleItems: Record<UserRole, NavItem[]> = {
    admin: [
      ...baseItems,
      { icon: <Users className="w-5 h-5" />, label: 'Customers', href: '/dashboard/admin/customers' },
      { icon: <Package className="w-5 h-5" />, label: 'Products', href: '/dashboard/admin/products' },
      { icon: <ShoppingCart className="w-5 h-5" />, label: 'Inventory', href: '/dashboard/admin/inventory' },
      { icon: <FileText className="w-5 h-5" />, label: 'Challans', href: '/dashboard/admin/challan' },
      { icon: <FileText className="w-5 h-5" />, label: 'Reports', href: '/dashboard/admin/reports' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/dashboard/admin/settings' },
    ],
    sales: [
      ...baseItems,
      { icon: <Users className="w-5 h-5" />, label: 'Customers', href: '/dashboard/sales/customers' },
      { icon: <ShoppingCart className="w-5 h-5" />, label: 'Orders', href: '/dashboard/sales/orders' },
      { icon: <FileText className="w-5 h-5" />, label: 'Reports', href: '/dashboard/sales/reports' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/dashboard/sales/settings' },
    ],
    warehouse: [
      ...baseItems,
      { icon: <Package className="w-5 h-5" />, label: 'Inventory', href: '/dashboard/warehouse/inventory' },
      { icon: <ShoppingCart className="w-5 h-5" />, label: 'Stock Movements', href: '/dashboard/warehouse/movements' },
      { icon: <FileText className="w-5 h-5" />, label: 'Reports', href: '/dashboard/warehouse/reports' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/dashboard/warehouse/settings' },
    ],
    accounts: [
      ...baseItems,
      { icon: <FileText className="w-5 h-5" />, label: 'Invoices', href: '/dashboard/accounts/invoices' },
      { icon: <Package className="w-5 h-5" />, label: 'Transactions', href: '/dashboard/accounts/transactions' },
      { icon: <FileText className="w-5 h-5" />, label: 'Reports', href: '/dashboard/accounts/reports' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/dashboard/accounts/settings' },
    ],
  }

  return roleItems[role]
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const roleNavItems = getNavItems(user.role)

  return (
    <motion.aside
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      className="w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 flex flex-col shadow-lg"
    >
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary">ERP CRM</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1 capitalize">{user.role} Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {roleNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <motion.div key={item.href} whileHover={{ x: 4 }}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs text-sidebar-foreground/60">Logged in as</p>
          <p className="font-semibold text-sidebar-foreground text-sm truncate">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/60">{user.email}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  )
}
