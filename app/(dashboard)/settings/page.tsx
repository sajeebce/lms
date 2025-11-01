import Link from 'next/link'
import { Settings as SettingsIcon, Palette, Bell, Shield, Users, BookOpen, Building2, Mail, CreditCard, HardDrive } from 'lucide-react'

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'General Settings',
      description: 'Institute name, logo, signature, currency, and country settings',
      icon: Building2,
      href: '/settings/general',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
    },
    {
      title: 'Academic Settings',
      description: 'Configure academic setup including cohorts and enrollment modes',
      icon: BookOpen,
      href: '/settings/academic',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'from-violet-50 to-purple-50',
    },
    {
      title: 'Email Settings',
      description: 'Configure email carrier (SMTP) and email templates',
      icon: Mail,
      href: '/settings/email',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50',
    },
    {
      title: 'Payment Methods',
      description: 'Configure payment gateways (Stripe, PayPal, Razorpay, etc.)',
      icon: CreditCard,
      href: '/settings/payment',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
    },
    {
      title: 'Storage Settings',
      description: 'Configure file storage (Local or Cloudflare R2)',
      icon: HardDrive,
      href: '/settings/storage',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'from-cyan-50 to-blue-50',
    },
    {
      title: 'Theme Settings',
      description: 'Customize your LMS appearance with colors and themes',
      icon: Palette,
      href: '/settings/theme',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'from-pink-50 to-rose-50',
    },
    {
      title: 'Notifications',
      description: 'Manage email and push notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'from-indigo-50 to-purple-50',
      disabled: true,
    },
    {
      title: 'Security',
      description: 'Password, two-factor authentication, and security settings',
      icon: Shield,
      href: '/settings/security',
      color: 'from-red-500 to-pink-600',
      bgColor: 'from-red-50 to-pink-50',
      disabled: true,
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/settings/users',
      color: 'from-slate-500 to-gray-600',
      bgColor: 'from-slate-50 to-gray-50',
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

