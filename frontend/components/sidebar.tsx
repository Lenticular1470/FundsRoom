'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  BarChart3,
  User,
  LogOut,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { UserRole } from '@/lib/types'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
}

const getNavItems = (role: UserRole): NavItem[] => {
  const roleItems: Record<UserRole, NavItem[]> = {
    sales: [
      { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/dashboard/sales' },
      { icon: <Users className="w-4 h-4" />, label: 'Customers', href: '/dashboard/sales/customers' },
      { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Sales Challans', href: '/dashboard/sales/challans' },
      { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', href: '/dashboard/sales/reports' },
      { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/dashboard/sales/profile' },
    ],
    admin: [
      { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/dashboard/admin' },
      { icon: <Users className="w-4 h-4" />, label: 'Customers', href: '/dashboard/admin/customers' },
      { icon: <Package className="w-4 h-4" />, label: 'Products', href: '/dashboard/admin/products' },
      { icon: <ShoppingCart className="w-4 h-4" />, label: 'Inventory', href: '/dashboard/admin/inventory' },
      { icon: <FileText className="w-4 h-4" />, label: 'Sales Challans', href: '/dashboard/admin/challan' },
      { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', href: '/dashboard/admin/reports' },
      { icon: <Settings className="w-4 h-4" />, label: 'Settings', href: '/dashboard/admin/settings' },
      { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/dashboard/admin/profile' },
    ],
    warehouse: [
      { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/dashboard/warehouse' },
      { icon: <Package className="w-4 h-4" />, label: 'Products', href: '/dashboard/warehouse/products' },
      { icon: <ShoppingCart className="w-4 h-4" />, label: 'Inventory', href: '/dashboard/warehouse/inventory' },
      { icon: <AlertCircle className="w-4 h-4" />, label: 'Low Stock', href: '/dashboard/warehouse/low-stock' },
      { icon: <BarChart3 className="w-4 h-4" />, label: 'Reports', href: '/dashboard/warehouse/reports' },
      { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/dashboard/warehouse/profile' },
    ],
    accounts: [
      { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/dashboard/accounts' },
      { icon: <FileSpreadsheet className="w-4 h-4" />, label: 'Sales Reports', href: '/dashboard/accounts/sales-reports' },
      { icon: <BarChart3 className="w-4 h-4" />, label: 'Financial Reports', href: '/dashboard/accounts/financial-reports' },
      { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/dashboard/accounts/profile' },
    ],
  }

  return roleItems[role] || roleItems.sales
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isWarehouseRoute = pathname.startsWith('/dashboard/warehouse')
  const isAccountsRoute = pathname.startsWith('/dashboard/accounts')
  const isDarkRoute = isWarehouseRoute || isAccountsRoute

  const currentUser = user || {
    name: isAccountsRoute ? 'rahala' : isWarehouseRoute ? 'bilibibili' : 'advika',
    email: isAccountsRoute ? 'rahala@kk' : isWarehouseRoute ? 'bi@hji.com' : 'advika@fundsroom.com',
    role: (isAccountsRoute ? 'accounts' : isWarehouseRoute ? 'warehouse' : 'sales') as UserRole
  }
  const activeRole = isAccountsRoute ? ('accounts' as UserRole) : isWarehouseRoute ? ('warehouse' as UserRole) : currentUser.role
  const roleNavItems = getNavItems(activeRole)

  if (isDarkRoute) {
    return (
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-64 bg-[#070a11] border-r border-slate-800/80 h-screen fixed left-0 top-0 flex flex-col shadow-xl z-30 font-sans"
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0092b8] to-[#00c994] flex items-center justify-center shadow-md shadow-[#0092b8]/20 text-white font-bold text-lg">
              F
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                FUNDSROOM
              </h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                ERP & CRM
              </p>
            </div>
          </div>

          {/* Role Badge Pill */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ROLE
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-extrabold tracking-wider uppercase">
              {activeRole}
            </span>
          </div>
        </div>

        {/* Menu Section */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
            {activeRole} MENU
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {roleNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard/warehouse' && pathname.startsWith(item.href))
            return (
              <motion.div key={item.href} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#121a2a] text-white border border-[#0092b8]/40 shadow-sm shadow-[#0092b8]/20'
                      : 'text-slate-400 hover:bg-[#0c121e] hover:text-slate-200'
                  }`}
                >
                  <span className={isActive ? 'text-[#00a8d6]' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800/70 bg-[#05070c] space-y-3">
          <div className="flex items-center justify-between gap-2 bg-[#0b1019] p-2.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-700">
                {currentUser.name ? currentUser.name.charAt(0).toLowerCase() : 'b'}
              </div>
              <div className="truncate">
                <p className="font-bold text-white text-xs truncate leading-tight">{currentUser.name || 'bilibibili'}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email || 'bi@hji.com'}</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.aside>
    )
  }

  // Default Light Theme Sidebar for Sales/Admin/Accounts
  return (
    <motion.aside
      initial={{ x: -256 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-64 bg-[#FAF7F2] border-r border-[#EFE7DB] h-screen fixed left-0 top-0 flex flex-col shadow-sm z-30 font-sans"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#EFE7DB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-400/20 text-slate-950 font-bold text-lg">
            F
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
              FUNDSROOM
            </h1>
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-widest mt-1">
              ERP & CRM
            </p>
          </div>
        </div>

        {/* Role Badge Pill */}
        <div className="mt-4 pt-3 border-t border-[#F0E8DD]/80 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            ROLE
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[11px] font-extrabold tracking-wider shadow-sm uppercase">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Menu Section */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
          {currentUser.role} MENU
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {roleNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard/admin' &&
              item.href !== '/dashboard/sales' &&
              item.href !== '/dashboard/warehouse' &&
              pathname.startsWith(item.href))
          return (
            <motion.div key={item.href} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-400/25 border border-amber-300'
                    : 'text-slate-700 hover:bg-[#F2ECE1] hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-slate-950' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-4 border-t border-[#EFE7DB] bg-[#F7F2E9]/60 space-y-3">
        <div className="flex items-center justify-between gap-2 bg-white/90 p-2.5 rounded-xl border border-[#EBE3D5] shadow-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 text-xs truncate leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.aside>
  )
}
