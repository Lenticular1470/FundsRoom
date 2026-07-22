import axiosClient from "@/lib/axiosClient"

export interface WarehouseStats {
  totalProducts: number
  totalInventoryQuantity: number
  totalInventoryValue: number
  todayStockIn: number
  todayStockOut: number
  lowStockCount: number
  pendingRequests: number
  capacityUsedPercentage: number
  recentMovements: Array<{
    id: string
    productName: string
    movementType: "IN" | "OUT"
    quantity: number
    createdBy: string
    createdAt: string
    reason: string
  }>
  stockHistory: Array<{
    date: string
    stockIn: number
    stockOut: number
  }>
  zoneStorage: Array<{
    zone: string
    value: number
  }>
}

export const WarehouseService = {
  async getDashboardStats(): Promise<WarehouseStats> {
    const response = await axiosClient.get("/dashboard/warehouse")
    return response.data?.data
  },
}
