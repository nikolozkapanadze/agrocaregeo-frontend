/**
 * Recommendations Domain Logic
 * 
 * Business rules for fertilizer recommendations, moon phase calculations,
 * and agricultural timing. Pure functions - no React dependencies.
 */

// ============================================================================
// Types
// ============================================================================

export type AppMode = 'foliar' | 'soil'

export interface MoonTiming {
  label: string
  color: string
  tip: string
}

export interface LunarAdvisory {
  favorable: boolean
  message: string
  color: string
}

export interface MineralStatus {
  label: string
  dose: number
  status: string
  hasDeficiency: boolean
  isUnknown: boolean
  displayDose: string
}

export interface PriorityConfig {
  color: string
  icon: string
  label: string
}

// Generic interface for priority-countable items
export interface PriorityItem {
  priority: number
}

// ============================================================================
// Constants
// ============================================================================

export const PRIORITY_COLORS: Record<number, string> = {
  1: '#d32f2f',  // Critical - Red
  2: '#f57c00',  // High - Orange
  3: '#388e3c',  // OK - Green
}

export const PRIORITY_ICONS: Record<number, string> = {
  1: '🔴',
  2: '🟡',
  3: '🟢',
}

export const ZONE_COLORS: Record<string, string> = {
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  ok: '#388e3c',
  unknown: '#8b949e',
}

// Moon phase activity categories
const WAXING_ACTIVITIES = ['plant_above', 'fertilize', 'harvest']
const WANING_ACTIVITIES = ['plant_root', 'prune', 'rest']

// ============================================================================
// Moon Phase Logic
// ============================================================================

/**
 * Get timing guidance for fertilizer application based on moon phase
 * 
 * Foliar (N sprays): waxing + full moon — sap rises, leaves absorb better
 * Soil (P/K/Mg ground): waning moon — energy draws downward to roots
 */
export function getMoonTiming(agriActivity: string, appMode: AppMode): MoonTiming {
  if (appMode === 'foliar') {
    if (WAXING_ACTIVITIES.includes(agriActivity)) {
      return {
        label: '🌔 ოპტიმალური',
        color: 'text-green-400',
        tip: 'მზარდი მთვარე — ფოთლოვანი სასუქი კარგად შეიწოვება',
      }
    }
    if (agriActivity === 'harvest') {
      return {
        label: '🌕 საუკეთესო',
        color: 'text-yellow-400',
        tip: 'სავსე მთვარე — მაქსიმალური შეწოვა',
      }
    }
    return {
      label: '🌘 მოიცადე',
      color: 'text-text-muted',
      tip: 'კლებადი მთვარე — ფოთლოვანი შეტანა ნაკლებ ეფექტური',
    }
  } else {
    if (WANING_ACTIVITIES.includes(agriActivity)) {
      return {
        label: '🌖 ოპტიმალური',
        color: 'text-green-400',
        tip: 'კლებადი მთვარე — ნიადაგის სასუქი ფესვებში ჩადის',
      }
    }
    if (agriActivity === 'rest') {
      return {
        label: '🌑 კარგი',
        color: 'text-green-300',
        tip: 'მთვარეობა — ნიადაგის მომზადება და შეტანა',
      }
    }
    return {
      label: '🌒 მოიცადე',
      color: 'text-text-muted',
      tip: 'მზარდი მთვარე — ნიადაგის სასუქი ნაკლებ ოპტიმალური',
    }
  }
}

/**
 * Get lunar advisory for fertilizer application
 * Returns whether current period is favorable and which types are recommended
 */
export function getLunarFertilizerAdvisory(agriActivity: string): LunarAdvisory {
  if (agriActivity === 'fertilize') {
    return {
      favorable: true,
      color: 'text-green-400',
      message: 'მთვარის კალენდრის მიხედვით ეს პერიოდი ხელსაყრელია სასუქის შეტანისთვის — განსაკუთრებით ფოთლოვანი აზოტოვანი (N) სასუქებისთვის.',
    }
  }
  if (WAXING_ACTIVITIES.includes(agriActivity)) {
    return {
      favorable: true,
      color: 'text-green-400',
      message: 'მთვარის კალენდრის მიხედვით ეს პერიოდი ხელსაყრელია ფოთლოვანი (N) სასუქის შეტანისთვის. ნიადაგის სასუქებისთვის (P/K/Mg) უმჯობესია კლებადი მთვარის ფაზის მოლოდინი.',
    }
  }
  if (WANING_ACTIVITIES.includes(agriActivity)) {
    return {
      favorable: true,
      color: 'text-green-400',
      message: 'მთვარის კალენდრის მიხედვით ეს პერიოდი ხელსაყრელია ნიადაგის სასუქების (P/K/Mg) შეტანისთვის. ფოთლოვანი (N) შეტანა უმჯობესია მზარდ ფაზაში გადავიდეთ.',
    }
  }
  return {
    favorable: false,
    color: 'text-text-muted',
    message: 'მთვარის კალენდრის მიხედვით ეს პერიოდი ნაკლებ ხელსაყრელია სასუქის შეტანისთვის. გირჩევთ, დაიცადოთ მომდევნო ხელსაყრელ ფაზამდე.',
  }
}

/**
 * Determine application mode based on fertilizer type
 * N can be foliar or soil; P/K/Mg are soil-applied
 */
export function getAppMode(type: string): AppMode {
  return type === 'N' ? 'foliar' : 'soil'
}

// ============================================================================
// Mineral Status Logic
// ============================================================================

/**
 * Calculate mineral status from dose and status fields
 */
export function calculateMineralStatus(
  label: string,
  dose: number | undefined,
  status: string | undefined
): MineralStatus {
  const doseValue = dose || 0
  const hasDeficiency = doseValue > 0 || status === 'low' || status === 'critical'
  const isUnknown = status === 'unknown' || !status

  return {
    label,
    dose: doseValue,
    status: status || 'unknown',
    hasDeficiency,
    isUnknown,
    displayDose: doseValue.toFixed(0),
  }
}

/**
 * Get CSS class for mineral status box
 */
export function getMineralStatusBoxClass(hasDeficiency: boolean, isUnknown: boolean): string {
  if (hasDeficiency) return 'border-yellow-500/30 bg-yellow-500/10'
  if (isUnknown) return 'border-bg-border bg-bg-primary/30'
  return 'border-bg-border bg-bg-primary/50'
}

/**
 * Get text color class for mineral status
 */
export function getMineralStatusTextClass(hasDeficiency: boolean, isUnknown: boolean): string {
  if (hasDeficiency) return 'text-yellow-500'
  if (isUnknown) return 'text-text-muted'
  return 'text-zone-ok'
}

// ============================================================================
// Priority & Zone Logic
// ============================================================================

/**
 * Get priority configuration (color, icon, label)
 */
export function getPriorityConfig(priority: number): PriorityConfig {
  return {
    color: PRIORITY_COLORS[priority] || PRIORITY_COLORS[3],
    icon: PRIORITY_ICONS[priority] || PRIORITY_ICONS[3],
    label: priority === 1 ? 'კრიტიკული' : priority === 2 ? 'მაღალი' : 'ნორმალური',
  }
}

/**
 * Get zone color based on status
 */
export function getZoneColor(status: string): string {
  return ZONE_COLORS[status] || ZONE_COLORS.unknown
}

/**
 * Calculate data quality indicator
 * Returns warning status for stale satellite data
 */
export function getDataQualityIndicator(satelliteAgeDays: number | undefined): {
  isStale: boolean
  warningClass: string
  warningText: string
} {
  const isStale = satelliteAgeDays !== undefined && satelliteAgeDays > 5
  
  return {
    isStale,
    warningClass: isStale ? 'text-yellow-500 ml-1' : 'ml-1',
    warningText: isStale ? ' ⚠️ მოძველებული' : '',
  }
}

// ============================================================================
// Sorting & Filtering
// ============================================================================

/**
 * Sort items by priority (critical first)
 */
export function sortZonesByPriority<T extends PriorityItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.priority - b.priority)
}

/**
 * Filter items by priority threshold
 */
export function filterZonesByPriority<T extends PriorityItem>(
  items: T[],
  maxPriority: number
): T[] {
  return items.filter((z) => z.priority <= maxPriority)
}

/**
 * Count items by priority
 */
export function countZonesByPriority<T extends PriorityItem>(items: T[]): {
  critical: number
  high: number
  ok: number
  total: number
} {
  return items.reduce(
    (acc, item) => {
      acc.total++
      if (item.priority === 1) acc.critical++
      else if (item.priority === 2) acc.high++
      else acc.ok++
      return acc
    },
    { critical: 0, high: 0, ok: 0, total: 0 }
  )
}

// ============================================================================
// Default Reason Helpers
// ============================================================================

/**
 * Get default reason text for mineral status
 */
export function getDefaultMineralReason(status: string | undefined, mineral: 'N' | 'P' | 'K' | 'Mg'): string {
  if (status === 'ok') return 'ნორმაშია'
  if (status === 'low' || status === 'critical') return 'დეფიციტი'
  if (mineral === 'N') return 'საჭიროებს შეტანას'
  return 'არ არის მონაცემი'
}
