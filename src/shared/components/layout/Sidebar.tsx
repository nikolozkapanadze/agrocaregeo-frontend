import React, { useState, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  TreePine,
  Droplets,
  Sprout,
  Wallet,
  Send,
  X,
  ChevronDown,
  User,
  Users,
  Target,
  Leaf,
  Bug,
  FlaskConical,
  Cloud,
  ShieldAlert,
  TrendingUp,
  BarChart2,
  Wind,
  CalendarDays,
  Scissors,
  Globe2,
  Moon,
  BookOpen,
  Layers,
  Bot,
  Satellite,
  Plane,
  Bell,
  Settings,
  Radio,
} from 'lucide-react'
import { useAuthStore, useProfileStore } from '@/shared/stores'
import { useSelectedCrop } from '@/hooks/useSelectedCrop'

interface NavItem {
  to: string
  label: string
  icon: React.ReactElement
  feature?: string
  role?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'მთავარი',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: '/alerts', label: 'შეტყობინებები', icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    label: 'მეურნეობა',
    items: [
      { to: '/parcels', label: 'ნაკვეთები', icon: <TreePine className="h-4 w-4" /> },
      { to: '/crops', label: 'კულტურები', icon: <Leaf className="h-4 w-4" /> },
      { to: '/map', label: 'რუკა', icon: <Map className="h-4 w-4" /> },
    ],
  },
  {
    label: 'ამინდი და სატელიტი',
    items: [
      { to: '/weather', label: 'ამინდის პროგნოზი', icon: <Cloud className="h-4 w-4" /> },
      { to: '/weather-anomaly', label: 'კლიმ. ანომალია', icon: <BarChart2 className="h-4 w-4" /> },
      { to: '/ndvi-series', label: 'NDVI სერია', icon: <Globe2 className="h-4 w-4" /> },
      { to: '/fleet-health', label: 'სატელიტური მონიტ.', icon: <Satellite className="h-4 w-4" /> },
      { to: '/drone', label: 'დრონის ანალიზი', icon: <Plane className="h-4 w-4" /> },
      { to: '/stations', label: 'სადგურები', icon: <Radio className="h-4 w-4" /> },
    ],
  },
  {
    label: 'კულტურის მართვა',
    items: [
      { to: '/fertilizer', label: 'სასუქი', icon: <Sprout className="h-4 w-4" /> },
      { to: '/irrigation', label: 'მორწყვა', icon: <Droplets className="h-4 w-4" />, feature: 'irrigation' },
      { to: '/irrigation-schedule', label: 'სარწყავი გრაფიკი', icon: <CalendarDays className="h-4 w-4" />, feature: 'irrigation' },
      { to: '/spray', label: 'სპრეი / ფუნგიციდი', icon: <ShieldAlert className="h-4 w-4" />, feature: 'spray' },
      { to: '/spray-windows', label: 'სპრეის ფანჯრები', icon: <Wind className="h-4 w-4" />, feature: 'spray' },
      { to: '/moon-calendar', label: 'მთვარის კალენდარი', icon: <Moon className="h-4 w-4" /> },
      { to: '/harvest-timing', label: 'მკის დრო', icon: <Scissors className="h-4 w-4" />, feature: 'harvest_timing' },
    ],
  },
  {
    label: 'ანალიზი',
    items: [
      { to: '/recommendations', label: 'რეკომენდაციები', icon: <Target className="h-4 w-4" />, feature: 'mineral_analysis' },
      { to: '/vra-enhanced', label: 'VRA ანალიზი', icon: <Layers className="h-4 w-4" />, feature: 'mineral_analysis' },
      { to: '/soil', label: 'ნიადაგის ანალიზი', icon: <FlaskConical className="h-4 w-4" /> },
      { to: '/disease', label: 'დაავადებები', icon: <Bug className="h-4 w-4" />, feature: 'disease' },
      { to: '/yield-forecast', label: 'მოსავლიანობა', icon: <TrendingUp className="h-4 w-4" />, feature: 'yield_forecast' },
      { to: '/finances', label: 'ფინანსები', icon: <Wallet className="h-4 w-4" /> },
      { to: '/scientific', label: 'სამეცნიერო სიზუსტე', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  {
    label: 'პარამეტრები',
    items: [
      { to: '/profile', label: 'მეურნის პროფილი', icon: <User className="h-4 w-4" /> },
      { to: '/profile-management', label: 'პროფილების მართვა', icon: <Settings className="h-4 w-4" /> },
      { to: '/telegram', label: 'Telegram', icon: <Send className="h-4 w-4" /> },
      { to: '/ai-agent', label: 'AI ასისტენტი', icon: <Bot className="h-4 w-4" /> },
      { to: '/users', label: 'მომხმარებლები', icon: <Users className="h-4 w-4" />, role: 'admin' },
    ],
  },
]

// Crop-specific navigation items
interface CropNavItem {
  to: string
  label: string
  icon: React.ReactElement
}

const cropNavItems: Record<string, CropNavItem[]> = {
  vine:      [{ to: '/crops/vine',      label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  hazelnut:  [{ to: '/crops/hazelnut',  label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  wheat:     [{ to: '/crops/wheat',     label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  olive:     [{ to: '/crops/olive',     label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  walnut:    [{ to: '/crops/walnut',    label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  blueberry: [{ to: '/crops/blueberry', label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  almond:    [{ to: '/crops/almond',    label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  tea:       [{ to: '/crops/tea',       label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  citrus:    [{ to: '/crops/citrus',    label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  corn:      [{ to: '/crops/corn',      label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  sunflower: [{ to: '/crops/sunflower', label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  barley:    [{ to: '/crops/barley',    label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  soybean:   [{ to: '/crops/soybean',   label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
  rapeseed:  [{ to: '/crops/rapeseed',  label: 'მიმოხილვა', icon: <LayoutDashboard className="h-4 w-4" /> }],
}

// Crops with full (crop-specific) recommendation modules vs stub/alias fallback
const FULL_SUPPORT_CROPS = new Set([
  'wheat', 'corn', 'soybean', 'almond', 'vine', 'blueberry',
])
const PARTIAL_SUPPORT_CROPS = new Set([
  'barley', 'oats', 'rye', 'triticale', 'sorghum', 'maize',
  'hazelnut', 'walnut',
  'sunflower', 'rapeseed', 'olive', 'citrus', 'tea',
])

// Crop display names
const cropNames: Record<string, string> = {
  vine: 'ვენახი',
  hazelnut: 'თხილი',
  olive: 'ზეთისხილი',
  walnut: 'კაკალი',
  blueberry: 'მოცვი',
  almond: 'ნუში',
  tea: 'ჩაი',
  citrus: 'ციტრუსი',
  wheat: 'ხორბალი',
  corn: 'სიმინდი',
  sunflower: 'მზესუმზირა',
  barley: 'ჭვავი',
  soybean: 'სოიო',
  rapeseed: 'კამელი',
}

interface CropSidebarProps {
  cropId: string
  onClose?: () => void
}

function CropSidebar({ cropId, onClose }: CropSidebarProps): React.ReactElement | null {
  const items = cropNavItems[cropId]
  if (!items) return null

  const hasFullSupport = FULL_SUPPORT_CROPS.has(cropId)
  const hasPartialSupport = PARTIAL_SUPPORT_CROPS.has(cropId)

  return (
    <div className="px-3 py-2 border-t border-white/10">
      <div className="mb-2 flex items-center gap-2 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent font-display">
          {cropNames[cropId] || cropId}
        </p>
        {hasFullSupport && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-zone-ok"
            title="სრული რეკომენდაციების მხარდაჭერა"
            role="img"
            aria-label="Full support indicator"
          />
        )}
        {hasPartialSupport && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-zone-high"
            title="დროებითი რეკომენდაციები (მოდული მზადდება)"
            role="img"
            aria-label="Partial support indicator"
          />
        )}
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps): React.ReactElement {
  const location = useLocation()
  const { crop } = useSelectedCrop()
  const { activeProfile, categories } = useProfileStore()
  const { user } = useAuthStore()
  
  // Detect if we're on a crop page from URL
  const cropMatch = location.pathname.match(/\/crops\/([^\/]+)/)
  const currentCropId = cropMatch ? cropMatch[1] : null
  
  // Use selected crop from localStorage if not on specific crop URL
  const activeCropId = currentCropId || crop

  // Get active profile's features for nav filtering
  const activeFeatures = useMemo(() => {
    if (!activeProfile) return null
    const cat = categories.find(c => c.key === activeProfile.profile_type_slug)
    return cat ? new Set(cat.features) : null
  }, [activeProfile, categories])

  // Filter nav groups based on active profile features and user role
  const visibleGroups = useMemo(() => {
    return navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          const featureOk = !item.feature || !activeFeatures || activeFeatures.has(item.feature)
          const roleOk = !item.role || user?.role === item.role
          return featureOk && roleOk
        }),
      }))
      .filter(group => group.items.length > 0)
  }, [activeFeatures, user])

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(['ამინდი და სატელიტი', 'ანალიზი'])
  )

  const toggleGroup = (label: string) =>
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })

  return (
    <div className="flex h-full flex-col relative">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-transparent to-sensor/[0.02] pointer-events-none" />

      {/* Logo */}
      <div className="relative flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent via-accent to-sensor shadow-glow">
          <Satellite className="h-5 w-5 text-base-primary" />
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-xl border border-accent/30 animate-pulse-slow" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary tracking-tight font-display">AgroCareGeo</span>
          <span className="text-[10px] text-accent/70 font-mono tracking-[0.2em]">COMMAND CENTER</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="ml-auto p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {visibleGroups.map((group, idx) => (
          <div key={group.label} className={idx > 0 ? 'pt-2' : ''}>
            {/* Group separator line */}
            {idx > 0 && <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-3" />}
            
            <button
              onClick={() => toggleGroup(group.label)}
              aria-expanded={!collapsedGroups.has(group.label)}
              aria-controls={`nav-group-${group.label}`}
              className="flex w-full items-center justify-between px-3 py-2 mb-1 rounded-lg hover:bg-white/[0.02] transition-colors group"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted group-hover:text-text-secondary transition-colors font-display">
                {group.label}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-text-muted/50 group-hover:text-text-muted transition-all duration-200 ${
                  collapsedGroups.has(group.label) ? '-rotate-90' : ''
                }`}
              />
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                collapsedGroups.has(group.label) ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
              }`}
            >
              <ul id={`nav-group-${group.label}`} className="flex flex-col gap-0.5 pb-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-accent/[0.12] text-accent shadow-inner-glow border-l-2 border-accent ml-0.5'
                            : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary border-l-2 border-transparent ml-0.5'
                        }`
                      }
                    >
                      <span className="transition-transform duration-200 group-hover:scale-110">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Crop-specific submenu */}
        {activeCropId && cropNavItems[activeCropId] && (
          <CropSidebar cropId={activeCropId} onClose={onClose} />
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-4 bg-gradient-to-t from-base-primary/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-accent animate-ping opacity-75" />
            </div>
            <span className="text-xs text-text-secondary font-medium">სისტემა აქტიური</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono bg-white/[0.03] px-2 py-0.5 rounded">v2.0.1</span>
        </div>
      </div>
    </div>
  )
}
