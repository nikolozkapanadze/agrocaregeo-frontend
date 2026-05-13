import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useProfileStore } from '@/shared/stores'
import Layout from '@/shared/components/Layout'

import Login from '@/features/auth/Login'

// Lazy load heavy components for better initial load performance
const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard'))
const MapView = React.lazy(() => import('@/features/parcels/MapView'))
const Alerts = React.lazy(() => import('@/pages/Alerts'))
const Parcels = React.lazy(() => import('@/features/parcels/Parcels'))
const FertilizerLog = React.lazy(() => import('@/features/fertilizer/FertilizerLog'))
const IrrigationLog = React.lazy(() => import('@/features/irrigation/IrrigationLog'))
const FinancesDashboard = React.lazy(() => import('@/features/finances/FinancesDashboard'))
const TelegramConnect = React.lazy(() => import('@/features/telegram/TelegramConnect'))
const Recommendations = React.lazy(() => import('@/features/fertilizer/Recommendations'))
const Disease = React.lazy(() => import('@/features/disease/Disease'))
const SoilAnalysis = React.lazy(() => import('@/features/farmer/SoilAnalysis'))
const WeatherForecast = React.lazy(() => import('@/features/weather/WeatherForecast'))
const SprayLog = React.lazy(() => import('@/features/disease/SprayLog'))
const FarmerProfile = React.lazy(() => import('@/features/farmer/FarmerProfile'))
const YieldForecast = React.lazy(() => import('@/features/fertilizer/YieldForecast'))

const SprayWindows = React.lazy(() => import('@/features/disease/SprayWindows'))
const IrrigationSchedule = React.lazy(() => import('@/features/irrigation/IrrigationSchedule'))
const HarvestTiming = React.lazy(() => import('@/features/harvest/HarvestTiming'))
const FleetHealth = React.lazy(() => import('@/features/fleet/FleetHealth'))
const NdviSeries = React.lazy(() => import('@/features/ndvi/NdviSeries'))
const WeatherAnomaly = React.lazy(() => import('@/features/weather/WeatherAnomaly'))
const MoonCalendar = React.lazy(() => import('@/features/harvest/MoonCalendar'))
const ScientificDocs = React.lazy(() => import('@/features/scientific/ScientificDocs'))
const VRAEnhanced = React.lazy(() => import('@/features/scientific/VRAEnhanced'))
const AIAgentPage = React.lazy(() => import('@/features/ai/AIAgentPage'))
const DroneProcessing = React.lazy(() => import('@/features/drone/DroneProcessing'))
const Crops = React.lazy(() => import('@/pages/Crops'))
const CropDashboard = React.lazy(() => import('@/pages/CropDashboard'))
const ProfileSetup = React.lazy(() => import('@/features/profile/ProfileSetup'))
const ProfileManagement = React.lazy(() => import('@/features/profile/ProfileManagement'))
const UserManagement = React.lazy(() => import('@/features/users/UserManagement'))
const WeatherStations = React.lazy(() => import('@/pages/WeatherStations'))
const WeatherStationDetail = React.lazy(() => import('@/pages/WeatherStationDetail'))
const WeatherStationAdd = React.lazy(() => import('@/pages/WeatherStationAdd'))

function RouteLoading(): React.ReactElement {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-bg-border border-t-accent" />
      <span className="ml-3 text-text-secondary">იტვირთება...</span>
    </div>
  )
}

// Auth guard — redirects to /login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="flex flex-col items-center gap-4 text-text-secondary relative z-10">
          <div className="h-10 w-10 animate-spin rounded-xl border-2 border-white/10 border-t-accent shadow-glow" />
          <span className="text-sm font-mono tracking-wider">INITIALIZING...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Profile guard — redirects to /profile-setup if user has no profiles yet.
// Skips the API fetch if profiles are already in the store (persisted from a
// previous session), so returning users see no spinner.
function ProfileGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const { profiles, fetchProfiles } = useProfileStore()
  const [initialized, setInitialized] = useState(profiles.length > 0)

  useEffect(() => {
    if (!initialized) {
      fetchProfiles().finally(() => setInitialized(true))
    }
  }, [])

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    )
  }

  if (profiles.length === 0) {
    return <Navigate to="/profile-setup" replace />
  }

  return <>{children}</>
}

function AuthInitializer({ children }: { children: React.ReactNode }): React.ReactElement {
  const { fetchUser, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
    }
  }, [fetchUser, isAuthenticated])

  return <>{children}</>
}

export default function App(): React.ReactElement {
  return (
    <AuthInitializer>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Profile setup — protected but NO sidebar/header (standalone full-screen page) */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <Suspense fallback={<RouteLoading />}><ProfileSetup /></Suspense>
              </ProtectedRoute>
            }
          />

          {/* All app routes — require auth AND at least one profile */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProfileGuard>
                  <Layout />
                </ProfileGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<RouteLoading />}><Dashboard /></Suspense>} />
            <Route path="map" element={<Suspense fallback={<RouteLoading />}><MapView /></Suspense>} />
            <Route path="alerts" element={<Suspense fallback={<RouteLoading />}><Alerts /></Suspense>} />
            <Route path="crops" element={<Suspense fallback={<RouteLoading />}><Crops /></Suspense>} />
            <Route path="crops/:cropId" element={<Suspense fallback={<RouteLoading />}><CropDashboard /></Suspense>} />
            <Route path="parcels" element={<Suspense fallback={<RouteLoading />}><Parcels /></Suspense>} />
            <Route path="fertilizer" element={<Suspense fallback={<RouteLoading />}><FertilizerLog /></Suspense>} />
            <Route path="irrigation" element={<Suspense fallback={<RouteLoading />}><IrrigationLog /></Suspense>} />
            <Route path="finances" element={<Suspense fallback={<RouteLoading />}><FinancesDashboard /></Suspense>} />
            <Route path="costs" element={<Navigate to="/finances" replace />} />
            <Route path="telegram" element={<Suspense fallback={<RouteLoading />}><TelegramConnect /></Suspense>} />
            <Route path="recommendations" element={<Suspense fallback={<RouteLoading />}><Recommendations /></Suspense>} />
            <Route path="disease" element={<Suspense fallback={<RouteLoading />}><Disease /></Suspense>} />
            <Route path="soil" element={<Suspense fallback={<RouteLoading />}><SoilAnalysis /></Suspense>} />
            <Route path="weather" element={<Suspense fallback={<RouteLoading />}><WeatherForecast /></Suspense>} />
            <Route path="spray" element={<Suspense fallback={<RouteLoading />}><SprayLog /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<RouteLoading />}><FarmerProfile /></Suspense>} />
            <Route path="profile-management" element={<Suspense fallback={<RouteLoading />}><ProfileManagement /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<RouteLoading />}><UserManagement /></Suspense>} />
            <Route path="yield-forecast" element={<Suspense fallback={<RouteLoading />}><YieldForecast /></Suspense>} />
            <Route path="economics" element={<Navigate to="/finances" replace />} />
            <Route path="spray-windows" element={<Suspense fallback={<RouteLoading />}><SprayWindows /></Suspense>} />
            <Route path="irrigation-schedule" element={<Suspense fallback={<RouteLoading />}><IrrigationSchedule /></Suspense>} />
            <Route path="harvest-timing" element={<Suspense fallback={<RouteLoading />}><HarvestTiming /></Suspense>} />
            <Route path="fleet-health" element={<Suspense fallback={<RouteLoading />}><FleetHealth /></Suspense>} />
            <Route path="ndvi-series" element={<Suspense fallback={<RouteLoading />}><NdviSeries /></Suspense>} />
            <Route path="weather-anomaly" element={<Suspense fallback={<RouteLoading />}><WeatherAnomaly /></Suspense>} />
            <Route path="moon-calendar" element={<Suspense fallback={<RouteLoading />}><MoonCalendar /></Suspense>} />
            <Route path="scientific" element={<Suspense fallback={<RouteLoading />}><ScientificDocs /></Suspense>} />
            <Route path="vra-enhanced" element={<Suspense fallback={<RouteLoading />}><VRAEnhanced /></Suspense>} />
            <Route path="drone" element={<Suspense fallback={<RouteLoading />}><DroneProcessing /></Suspense>} />
            <Route path="ai-agent" element={<Suspense fallback={<RouteLoading />}><AIAgentPage /></Suspense>} />
            <Route path="ai-game" element={<Navigate to="/ai-agent" replace />} />
            <Route path="stations" element={<Suspense fallback={<RouteLoading />}><WeatherStations /></Suspense>} />
            <Route path="stations/add" element={<Suspense fallback={<RouteLoading />}><WeatherStationAdd /></Suspense>} />
            <Route path="stations/:stationId" element={<Suspense fallback={<RouteLoading />}><WeatherStationDetail /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthInitializer>
  )
}
