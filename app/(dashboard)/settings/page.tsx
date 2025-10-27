import Link from 'next/link'
import { Settings as SettingsIcon, Palette, Bell, Shield, Users } from 'lucide-react'

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'Theme Settings',
      description: 'Customize your LMS appearance with colors and themes',
      icon: Palette,
      href: '/settings/theme',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'from-violet-50 to-purple-50',
    },
    {
      title: 'Notifications',
      description: 'Manage email and push notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50',
      disabled: true,
    },
    {
      title: 'Security',
      description: 'Password, two-factor authentication, and security settings',
      icon: Shield,
      href: '/settings/security',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
      disabled: true,
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/settings/users',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      disabled: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-xl p-6 border border-neutral-200 bg-gradient-to-r from-slate-50 to-neutral-50">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl shadow-md bg-gradient-to-br from-slate-500 to-gray-600">
            <SettingsIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Manage your LMS configuration and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          const Component = category.disabled ? 'div' : Link
          
          return (
            <Component
              key={category.title}
              href={category.disabled ? '#' : category.href}
              className={`
                relative block p-6 rounded-xl border-2 transition-all
                ${category.disabled 
                  ? 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed' 
                  : 'border-neutral-200 hover:border-violet-300 hover:shadow-lg bg-white'
                }
              `}
            >
              {category.disabled && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-neutral-200 text-neutral-600 text-xs font-medium rounded-full">
                  Coming Soon
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shadow-md bg-gradient-to-br ${category.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {category.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {category.description}
                  </p>
                </div>
              </div>
            </Component>
          )
        })}
      </div>
    </div>
  )
}

