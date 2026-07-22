'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import axiosClient from '@/lib/axiosClient'
import { UserRole } from '@/lib/types'
import {
  Lock,
  Mail,
  User,
  Briefcase,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react'

// Zod schemas for Sign In & Create Account
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Full Name is required')
    .min(3, 'Full Name must be at least 3 characters'),
  email: z
    .string()
    .min(1, 'Work Email is required')
    .email('Must be a valid email'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'], {
    errorMap: () => ({ message: 'Role is required' }),
  }),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character'),
})

type SignInFormData = z.infer<typeof signInSchema>
type RegisterFormData = z.infer<typeof registerSchema>

const roleMap: Record<string, UserRole> = {
  ADMIN: 'admin',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  ACCOUNTS: 'accounts',
  admin: 'admin',
  sales: 'sales',
  warehouse: 'warehouse',
  accounts: 'accounts',
}

interface ToastState {
  type: 'success' | 'error'
  message: string
}

export default function LoginForm({ initialTab = 'signin' }: { initialTab?: 'signin' | 'register' }) {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialTab)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  // Sign In Form
  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    setValue: setSignInValue,
    formState: { errors: signInErrors, isSubmitting: isSignInSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Create Account Form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    reset: resetRegisterForm,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'ADMIN',
      password: '',
    },
  })

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // Handle Sign In Submit
  const onSignInSubmit = async (data: SignInFormData) => {
    setErrorMessage(null)
    try {
      const response = await axiosClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      })

      const payload = response.data
      const token = payload.token
      const userData = payload.data

      if (!token || !userData) {
        throw new Error('Invalid response structure from backend.')
      }

      const normalizedRole = roleMap[userData.role] ?? 'admin'
      login(
        {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: normalizedRole,
        },
        token
      )

      showToast('success', 'Signed in successfully!')
      router.push(`/dashboard/${normalizedRole}`)
    } catch (err: any) {
      const msg = err.message || 'Unable to sign in. Please check your credentials.'
      setErrorMessage(msg)
      showToast('error', msg)
    }
  }

  // Handle Create Account Submit
  const onRegisterSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null)
    try {
      await axiosClient.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      })

      showToast('success', 'Account created successfully! Please sign in.')
      setSignInValue('email', data.email)
      resetRegisterForm()
      setActiveTab('signin')
    } catch (err: any) {
      let msg = err.message
      if (msg === 'Email already registered.') {
        msg = 'This email is already registered.'
      }
      setErrorMessage(msg)
      showToast('error', msg)
    }
  }

  const handleTabChange = (tab: 'signin' | 'register') => {
    setErrorMessage(null)
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:opacity-70 transition-opacity"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md my-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2 tracking-tight">
            ERP CRM System
          </h1>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            Manage operations, sales, warehouse, and accounting with live backend sync
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-amber-100 dark:border-amber-900/40 relative">
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 p-1.5 mb-6 rounded-2xl bg-amber-100/60 dark:bg-slate-800/80 relative">
            <button
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`py-2.5 text-sm font-semibold rounded-xl transition-all relative z-10 ${
                activeTab === 'signin'
                  ? 'text-amber-900 dark:text-amber-100 shadow-md'
                  : 'text-amber-700/70 dark:text-amber-300/70 hover:text-amber-900 dark:hover:text-amber-100'
              }`}
            >
              {activeTab === 'signin' && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl z-[-1]"
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                />
              )}
              Sign In
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`py-2.5 text-sm font-semibold rounded-xl transition-all relative z-10 ${
                activeTab === 'register'
                  ? 'text-amber-900 dark:text-amber-100 shadow-md'
                  : 'text-amber-700/70 dark:text-amber-300/70 hover:text-amber-900 dark:hover:text-amber-100'
              }`}
            >
              {activeTab === 'register' && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl z-[-1]"
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                />
              )}
              Create Account
            </button>
          </div>

          {/* Alert Message for Backend Error */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 p-3.5 text-sm text-red-700 dark:text-red-200 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Content with Tab Switching Animation */}
          <AnimatePresence mode="wait">
            {activeTab === 'signin' ? (
              <motion.form
                key="signin-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignInSubmit(onSignInSubmit)}
                className="space-y-5"
              >
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-100">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-amber-500" />
                    <input
                      {...registerSignIn('email')}
                      type="email"
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-100 placeholder-amber-500/70 dark:placeholder-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  {signInErrors.email && (
                    <p className="text-red-500 text-xs font-medium pl-1">
                      {signInErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-100">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-amber-500" />
                    <input
                      {...registerSignIn('password')}
                      type={showSignInPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-100 placeholder-amber-500/70 dark:placeholder-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-4 top-3.5 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 focus:outline-none"
                      aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignInPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {signInErrors.password && (
                    <p className="text-red-500 text-xs font-medium pl-1">
                      {signInErrors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-amber-800 dark:text-amber-200 cursor-pointer">
                    <input
                      {...registerSignIn('rememberMe')}
                      type="checkbox"
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Remember Me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      showToast('error', 'Password reset instructions send link is unavailable in demo.')
                    }
                    className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 font-medium hover:underline focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSignInSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSignInSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-300 text-center">
                  <p>Default admin login:</p>
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mt-0.5">
                    admin@example.com / Admin123!
                  </p>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-100">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-amber-500" />
                    <input
                      {...registerRegister('name')}
                      type="text"
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-100 placeholder-amber-500/70 dark:placeholder-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  {registerErrors.name && (
                    <p className="text-red-500 text-xs font-medium pl-1">
                      {registerErrors.name.message}
                    </p>
                  )}
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-100">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-amber-500" />
                    <input
                      {...registerRegister('email')}
                      type="email"
                      placeholder="john@company.com"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-100 placeholder-amber-500/70 dark:placeholder-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="text-red-500 text-xs font-medium pl-1">
                      {registerErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Department Role */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-100">
                    Department Role
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-amber-500 pointer-events-none" />
                    <select
                      {...registerRegister('role')}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="SALES">SALES</option>
                      <option value="WAREHOUSE">WAREHOUSE</option>
                      <option value="ACCOUNTS">ACCOUNTS</option>
                    </select>
                  </div>
                  {registerErrors.role && (
                    <p className="text-red-500 text-xs font-medium pl-1">
                      {registerErrors.role.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-amber-900 dark:text-amber-100">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-amber-500" />
                    <input
                      {...registerRegister('password')}
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars (A-z, 0-9, special)"
                      className="w-full pl-12 pr-12 py-3 rounded-2xl border border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-100 placeholder-amber-500/70 dark:placeholder-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-4 top-3.5 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 focus:outline-none"
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <p className="text-red-500 text-xs font-medium pl-1">
                      {registerErrors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isRegisterSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isRegisterSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
