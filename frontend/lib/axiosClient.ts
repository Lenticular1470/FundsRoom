import axios from "axios"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000"
const AUTH_STORAGE_KEY = "fundsroom_auth"

export const axiosClient = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    "Content-Type": "application/json",
  },
})

axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed?.token) {
            config.headers.Authorization = `Bearer ${parsed.token}`
          }
        } catch {
          // Ignore JSON parse error
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Server unavailable"))
    }

    const resData = error.response.data
    const message =
      resData?.message ||
      (Array.isArray(resData?.errors) && resData.errors.length > 0
        ? resData.errors.map((e: any) => e.message || e).join(", ")
        : null) ||
      error.message ||
      "An unexpected error occurred"

    const customError = new Error(message) as any
    customError.status = error.response.status
    customError.data = resData
    return Promise.reject(customError)
  }
)

export default axiosClient

