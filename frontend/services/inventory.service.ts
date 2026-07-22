import axiosClient from "@/lib/axiosClient"

export interface StockMovementInput {
  productId: string
  quantity: number
  movementType: "IN" | "OUT"
  reason: string
}

export interface InventoryLog {
  id: string
  productId: string
  productName: string
  quantity: number
  type: "in" | "out"
  reason: string
  createdAt: string
  createdBy: string
}

export interface StockMovementResponse {
  items: InventoryLog[]
  total: number
  page: number
  limit: number
}

export const InventoryService = {
  async getMovements(params?: { search?: string; page?: number; limit?: number }): Promise<StockMovementResponse> {
    const response = await axiosClient.get("/stock", { params })
    const items = (response.data?.data?.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name || "Unknown Product",
      quantity: item.quantity,
      type: (item.movementType || "IN").toLowerCase() as "in" | "out",
      reason: item.reason,
      createdAt: item.createdAt,
      createdBy: item.createdBy?.name || "System",
    }))
    return {
      items,
      total: response.data?.data?.total || 0,
      page: response.data?.data?.page || 1,
      limit: response.data?.data?.limit || 20,
    }
  },

  async createMovement(data: StockMovementInput): Promise<any> {
    const response = await axiosClient.post("/stock", data)
    return response.data?.data
  },
}
