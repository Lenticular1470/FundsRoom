'use client'

import { useState } from 'react'
import DashboardHeader from '@/components/dashboard-header'
import { motion } from 'framer-motion'
import { Bell, Lock, Users, Palette, Save } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const settingsSections = [
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Notifications',
    description: 'Manage notification preferences and alerts',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Security',
    description: 'Password and security settings',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'User Management',
    description: 'Manage users and permissions',
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: 'Appearance',
    description: 'Customize appearance and theme',
  },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <DashboardHeader title="Settings" description="Configure your system settings and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
          <nav className="space-y-2 bg-card rounded-xl border border-border p-4 h-fit sticky top-8">
            {['profile', 'notifications', 'security', 'appearance'].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          {activeTab === 'profile' && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Profile Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center space-x-4 pb-6 border-b border-border">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {user?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user?.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user?.role} User</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      defaultValue={user?.phone}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.department}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">Role: <span className="font-semibold capitalize text-foreground">{user?.role}</span></p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { label: 'SMS Alerts', desc: 'Get SMS for critical alerts' },
                  { label: 'In-App Notifications', desc: 'Show notifications in the app' },
                  { label: 'Daily Summary', desc: 'Receive daily email summary' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={idx < 2}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-lg transition-shadow"
                >
                  Update Password
                </motion.button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">Appearance Settings</h2>
              <div className="space-y-6">
                <div>
                  <p className="font-medium text-foreground mb-4">Theme</p>
                  <div className="grid grid-cols-3 gap-4">
                    {['Light', 'Dark', 'System'].map((theme) => (
                      <motion.button
                        key={theme}
                        whileHover={{ scale: 1.05 }}
                        className="p-4 rounded-lg border-2 border-border hover:border-primary transition-colors text-foreground"
                      >
                        {theme}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-4">Color Scheme</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'Golden', color: 'bg-amber-500' },
                      { name: 'Ocean', color: 'bg-blue-500' },
                      { name: 'Forest', color: 'bg-green-500' },
                      { name: 'Sunset', color: 'bg-orange-500' },
                    ].map((scheme) => (
                      <motion.button
                        key={scheme.name}
                        whileHover={{ scale: 1.1 }}
                        className="p-4 rounded-lg border-2 border-border hover:border-foreground transition-colors"
                      >
                        <div className={`w-8 h-8 ${scheme.color} rounded-full mx-auto mb-2`} />
                        <p className="text-xs text-foreground">{scheme.name}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200"
            >
              Settings saved successfully!
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
