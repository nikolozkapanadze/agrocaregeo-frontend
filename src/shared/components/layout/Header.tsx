import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Satellite, ChevronDown, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/shared/stores'
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
    <div className="hidden md:flex items-center gap-2.5">
      <span className="font-mono text-xs text-accent/50" aria-hidden="true">/</span>
      <span className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm text-xs font-medium text-text-secondary tracking-wide hover:border-white/[0.12] transition-colors">
        {label}
      </span>
    </div>
  )
}

function LiveClock(): React.ReactElement {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </div>
      <time className="text-xs text-text-secondary font-mono tabular-nums">
        {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </time>
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
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-text-secondary transition-all duration-200 hover:bg-white/[0.04] hover:text-text-primary border border-transparent hover:border-white/[0.08] group"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-sensor/20 to-accent/20 shadow-inner-glow transition-all duration-200 group-hover:border-accent/30 group-hover:shadow-glow-sm">
          <User className="h-4 w-4 text-accent" />
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs font-semibold text-text-primary">
            {user?.full_name || 'User'}
          </span>
          <span className="text-[10px] text-text-muted capitalize font-medium">
            {user?.role || 'operator'}
          </span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div 
            className="absolute right-0 top-14 z-50 w-60 overflow-hidden rounded-2xl border border-white/[0.10] bg-bg-card/95 shadow-elevation-4 backdrop-blur-2xl animate-scale-in"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="border-b border-white/[0.06] px-4 py-4">
              <p className="text-sm font-semibold text-text-primary">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-text-muted font-mono mt-1">{user?.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="badge badge-info">{user?.role || 'user'}</span>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  onLogout()
                }}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-text-secondary transition-all hover:bg-danger/10 hover:text-danger"
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
    <header className="relative z-[100] flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.08] bg-bg-card/60 px-5 shadow-elevation-2 backdrop-blur-2xl">
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      
      {/* Hamburger for mobile */}
      <button
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-white/[0.05] hover:text-text-primary lg:hidden transition-all border border-transparent hover:border-white/[0.08]"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-sensor shadow-glow-sm">
          <Satellite className="h-4 w-4 text-base-primary" />
        </div>
        <span className="text-sm font-bold text-text-primary font-display">AgroCareGeo</span>
      </div>

      {/* Breadcrumb / Page title */}
      <PageTitle />

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Live time display */}
        <LiveClock />

        <ProfileSwitcher />

        <NotificationBell />

        <UserMenu user={user} onLogout={logout} />
      </div>
    </header>
  )
}
