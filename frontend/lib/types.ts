export type UserRole = 'admin' | 'sales' | 'warehouse' | 'accounts'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  department?: string
  createdAt?: string
}

export interface Customer {
  id: string
  name: string
  businessName?: string | null
  gst?: string | null
  email: string | null
  phone: string
  type: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR'
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE'
  address?: string | null
  followUpDate?: string | null
  notes?: string | null
  support?: string | null
  createdAt: string
  updatedAt?: string
  // legacy compat fields
  company?: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  cost?: number
  currentStock?: number
  minimumStock?: number
  // legacy compat
  stock?: number
  minStock?: number
  warehouse?: string | null
  description?: string
  image?: string
  createdAt?: string
}

export interface ChallanItem {
  id?: string
  productId?: string | null
  productName: string
  sku: string
  category: string
  price: number
  quantity: number
}

export interface Challan {
  id: string
  challanNumber: string
  customerId: string
  customer?: Customer
  items: ChallanItem[]
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  createdById?: string
  createdBy?: { id: string; name: string; email: string }
  createdAt: string
  updatedAt?: string
}

export type SalesChallan = Challan

export interface InventoryLog {
  id: string
  productId: string
  productName: string
  quantity: number
  type: 'in' | 'out'
  reason: string
  createdAt: string
  createdBy: string
}

export interface ReportData {
  summary?: {
    totalRevenue: number
    totalOrders: number
    activeCustomers: number
    avgOrderValue: number
  }
  todaysSales?: number
  monthlyRevenue?: number
  totalCustomers?: number
  pendingChallans?: number
  completedChallans?: number
  topCustomers?: Array<{
    name: string
    businessName?: string | null
    orders?: number
    totalValue?: number
    ordersCount?: number
    totalSpent?: number
  }>
  productDistribution?: Array<{ category: string; revenue: number; quantity: number }>
  salesTrend?: Array<{ month: string; revenue: number; orders: number }>
}


