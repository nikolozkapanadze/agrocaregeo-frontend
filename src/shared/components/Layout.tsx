import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useProfileStore } from '@/shared/stores'
import { useSelectedCrop } from '@/hooks/useSelectedCrop'
import { Sidebar, Header } from '@/shared/components/layout'
import { AIAgentPanel } from '@/features/ai'
import { ErrorBoundary, InlineErrorBoundary } from '@/shared/components/ErrorBoundary'

export default function Layout(): React.ReactElement {
  const { activeProfile } = useProfileStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { crop } = useSelectedCrop()

  // Detect current crop for AI context
  const cropMatch = location.pathname.match(/\/crops\/([^\/]+)/)
  const activeCropId = cropMatch ? cropMatch[1] : (crop || null)

  return (
    <div className="relative flex h-screen overflow-hidden bg-bg-primary">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:flex lg:flex-col border-r border-white/10 bg-bg-card/70 backdrop-blur-2xl shadow-2xl">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full w-60 bg-bg-card border-r border-white/10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/8 to-transparent" aria-hidden="true" />
        
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content - key forces full remount when active profile changes */}
        <main className="relative z-10 flex-1 overflow-y-auto p-5 lg:p-6">
          <ErrorBoundary key={activeProfile?.id ?? 'no-profile'}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Global AI Agent floating panel */}
      <InlineErrorBoundary>
        <AIAgentPanel cropType={activeCropId} />
      </InlineErrorBoundary>
    </div>
  )
}
