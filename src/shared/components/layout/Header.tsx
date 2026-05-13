import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Satellite, ChevronDown, User, LogOut } from 'lucide-react'
import { useAuthStore, useProfileStore } from '@/shared/stores'
import NotificationBell from '@/features/dashboard/components/NotificationBell'
import ProfileSwitcher from '@/features/profile/ProfileSwitcher'

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  map: 'რუკა',
  crops: 'კულტურები',
  weather: 'ამინდის პროგნოზი',
  parcels: 'ნაკვეთები',
  fertilizer: 'სასუქი',
  irrigation: 'მორწყვა',
  finances: 'ფინანსები',
  telegram: 'Telegram',
  recommendations: 'რეკომენდაციები',
  'vra-enhanced': 'VRA ანალიზი',
  drone: 'დრონის ანალიზი',
  disease: 'დაავადებები',
  soil: 'ნიადაგის ანალიზი',
  spray: 'სპრეი / ფუნგიციდი',
  profile: 'მეურნის პროფილი',
  'profile-management': 'პროფილების მართვა',
  'yield-forecast': 'მოსავლიანობა',
  economics: 'ეკონომიკა',
  'spray-windows': 'სპრეის ფანჯრები',
  'irrigation-schedule': 'სარწყავი გრაფიკი',
  'harvest-timing': 'მკის დრო',
  'fleet-health': 'სატელიტური მონიტ.',
  'ndvi-series': 'NDVI სერია',
  'weather-anomaly': 'კლიმ. ანომალია',
  stations: 'სადგურები',
  'moon-calendar': 'მთვარის კალენდარი',
  scientific: 'სამეცნიერო სიზუსტე',
  alerts: 'შეტყობინებები',
  'ai-agent': 'AI ასისტენტი',
}

function PageTitle(): React.ReactElement {
  const location = useLocation()
  const segment = location.pathname.split('/').filter(Boolean)[0] || 'dashboard'
  const label = PAGE_LABELS[segment] || segment
  return (
    <div className="hidden md:flex items-center gap-2">
      <span className="font-mono text-xs text-accent/60" aria-hidden="true">/</span>
      <span className="px-3 py-1 rounded-md border border-white/10 bg-bg-card/40 backdrop-blur-sm text-xs font-medium text-text-secondary tracking-wide">
        {label}
      </span>
    </div>
  )
}

interface UserMenuProps {
  user: { full_name?: string; email?: string; role?: string } | null
  onLogout: () => void
}

function UserMenu({ user, onLogout }: UserMenuProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary transition-all duration-200 hover:bg-white/5 hover:text-text-primary border border-transparent hover:border-white/5"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-sensor/25 to-accent/25 shadow-glow">
          <User className="h-4 w-4 text-accent" />
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs font-medium text-text-primary">
            {user?.full_name || 'User'}
          </span>
          <span className="text-[10px] text-text-muted capitalize">
            {user?.role || 'operator'}
          </span>
        </div>
        <ChevronDown className="h-3 w-3 text-text-muted" aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div 
            className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-bg-card/95 shadow-2xl backdrop-blur-2xl"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="border-b border-white/5 px-4 py-3">
              <p className="text-sm font-medium text-text-primary">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-text-muted font-mono mt-0.5">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="badge badge-info text-[10px]">{user?.role || 'user'}</span>
              </div>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                გასვლა
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps): React.ReactElement {
  const { user, logout } = useAuthStore()

  return (
    <header className="relative z-[100] flex h-16 shrink-0 items-center gap-4 border-b border-white/10 bg-bg-card/55 px-5 shadow-lg backdrop-blur-2xl">
      {/* Hamburger for mobile */}
      <button
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-white/5 hover:text-text-primary lg:hidden transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20">
          <Satellite className="h-4 w-4 text-accent" />
        </div>
        <span className="text-sm font-bold text-text-primary">AgroCareGeo</span>
      </div>

      {/* Breadcrumb / Page title */}
      <PageTitle />

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Time display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent status-pulse" aria-hidden="true" />
          <time className="text-xs text-text-secondary font-mono">
            {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>

        <ProfileSwitcher />

        <NotificationBell />

        <UserMenu user={user} onLogout={logout} />
      </div>
    </header>
  )
}
