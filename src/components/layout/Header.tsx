import type { ReactNode } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { YearSelector } from './YearSelector'
import { CurrencyToggle } from './CurrencyToggle'

interface HeaderProps {
  title?: string
  action?: ReactNode
}

export function Header({ title, action }: HeaderProps) {
  const { user } = useAuthStore()
  const { data: profile } = useProfile()

  // Get initials for fallback
  const getInitials = () => {
    if (profile?.name) {
      return profile.name.charAt(0).toUpperCase()
    }
    if (profile?.email || user?.email) {
      return (profile?.email || user?.email || '').charAt(0).toUpperCase()
    }
    return '?'
  }

  // Generate consistent color based on user identifier
  const getAvatarColor = () => {
    const str = profile?.name || profile?.email || user?.email || ''
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
          {action && <div>{action}</div>}
        </div>

        <div className="flex items-center gap-4">
          {/* Year Selector */}
          <YearSelector />

          {/* Currency Toggle */}
          <CurrencyToggle />

          {/* User Info */}
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor()}`}
              >
                {getInitials()}
              </div>
            )}
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {profile?.name || user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
