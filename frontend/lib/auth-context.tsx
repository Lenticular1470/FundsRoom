'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, UserRole } from './types'
import axiosClient from './axiosClient'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const AUTH_STORAGE_KEY = 'fundsroom_auth'

const roleMap: Record<string, UserRole> = {
  ADMIN: 'admin',
  USER: 'admin',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  ACCOUNTS: 'accounts',
  admin: 'admin',
  sales: 'sales',
  warehouse: 'warehouse',
  accounts: 'accounts',
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const login = useCallback((userData: User, authToken: string) => {
    const normalizedRole = roleMap[userData.role] ?? 'admin'
    const formattedUser: User = {
      ...userData,
      role: normalizedRole,
    }
    setUser(formattedUser)
    setToken(authToken)
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: formattedUser, token: authToken }))
    }
  }, [])

  useEffect(() => {
    const verifySession = async () => {
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) {
        setLoading(false)
        return
      }

      try {
        const parsed = JSON.parse(raw) as { user: User; token: string }
        if (!parsed.token) {
          logout()
          setLoading(false)
          return
        }

        setToken(parsed.token)
        setUser(parsed.user)

        // Verify token with backend /api/auth/me
        const response = await axiosClient.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
          },
        })

        if (response.data?.data) {
          const serverUser = response.data.data
          const normalizedRole = roleMap[serverUser.role] ?? parsed.user.role
          const updatedUser: User = {
            id: serverUser.id || parsed.user.id,
            name: serverUser.name || parsed.user.name,
            email: serverUser.email || parsed.user.email,
            role: normalizedRole,
          }
          setUser(updatedUser)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: updatedUser, token: parsed.token }))
        }
      } catch (error: any) {
        // If 401 Unauthorized or expired token, logout automatically
        if (error?.status === 401 || error?.response?.status === 401) {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [logout])

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

