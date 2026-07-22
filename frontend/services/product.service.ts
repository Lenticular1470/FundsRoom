import axiosClient from "@/lib/axiosClient"
import { Product } from "@/lib/types"

export interface ProductsResponse {
  items: Product[]
  total: number
  page: number
  limit: number
}

export const ProductService = {
  async getProducts(params?: { search?: string; page?: number; limit?: number }): Promise<ProductsResponse> {
    const response = await axiosClient.get("/products", { params })
    // Ensure all numeric values are correctly parsed
    const items = (response.data?.data?.items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      price: Number(item.price),
      currentStock: item.currentStock || 0,
      minimumStock: item.minimumStock || 0,
      warehouse: item.warehouse || "Default Warehouse",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
    return {
      items,
      total: response.data?.data?.total || 0,
      page: response.data?.data?.page || 1,
      limit: response.data?.data?.limit || 20,
    }
  },

  async getProductById(id: string): Promise<Product> {
    const response = await axiosClient.get(`/products/${id}`)
    const item = response.data?.data
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category,
      price: Number(item.price),
      currentStock: item.currentStock || 0,
      minimumStock: item.minimumStock || 0,
      warehouse: item.warehouse || "Default Warehouse",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }
  },

  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const response = await axiosClient.post("/products", {
      name: data.name,
      sku: data.sku,
      category: data.category,
      price: Number(data.price),
      currentStock: Number(data.currentStock || 0),
      minimumStock: Number(data.minimumStock || 0),
      warehouse: data.warehouse,
    })
    return response.data?.data
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await axiosClient.put(`/products/${id}`, {
      name: data.name,
      sku: data.sku,
      category: data.category,
      price: data.price !== undefined ? Number(data.price) : undefined,
      currentStock: data.currentStock !== undefined ? Number(data.currentStock) : undefined,
      minimumStock: data.minimumStock !== undefined ? Number(data.minimumStock) : undefined,
      warehouse: data.warehouse,
    })
    return response.data?.data
  },

  async deleteProduct(id: string): Promise<void> {
    await axiosClient.delete(`/products/${id}`)
  },
}
