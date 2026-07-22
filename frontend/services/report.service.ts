import axiosClient from "@/lib/axiosClient"

export interface ReportFilter {
  dateFrom?: string
  dateTo?: string
  category?: string
  warehouse?: string
}

export interface InventoryReportData {
  summary: {
    totalProducts: number
    totalStock: number
    totalValue: number
    lowStockCount: number
  }
  categories: Array<{
    category: string
    stock: number
    value: number
  }>
  products: Array<{
    sku: string
    name: string
    category: string
    stock: number
    price: number
    value: number
    status: string
  }>
}

export const ReportService = {
  async getInventoryReport(filters?: ReportFilter): Promise<InventoryReportData> {
    const response = await axiosClient.get("/reports/inventory", { params: filters })
    return response.data?.data
  },

  async getMovementsReport(filters?: ReportFilter): Promise<any[]> {
    const response = await axiosClient.get("/reports/movements", { params: filters })
    return response.data?.data
  },
}
