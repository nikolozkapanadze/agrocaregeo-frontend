import React, { useState, useEffect } from 'react'
import { Radar, CloudRain, Droplets, Sprout } from 'lucide-react'
import { satelliteService, type SARStatus } from '@/shared/api/services/satellite.service'
import { useProfileStore } from '@/shared/stores'

const PROGRESS_KEYFRAMES = `
  @keyframes sarProgress {
    0%   { left: -40%; right: 100%; }
    30%  { left: 10%;  right: 30%;  }
    70%  { left: 70%;  right: -10%; }
    100% { left: 120%; right: -40%; }
  }
`

interface SARPanelProps {
  daysStale?: number | null
}

export function SARPanel({ daysStale }: SARPanelProps): React.ReactElement | null {
  const { activeProfile } = useProfileStore()
  const [sarData, setSarData] = useState<SARStatus | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Re-fetch whenever the active profile changes
  useEffect(() => {
    fetchSARStatus()
  }, [activeProfile?.id])

  // Show SAR panel prominently when optical data is stale (>5 days)
  const showProminent = daysStale && daysStale > 5

  const fetchSARStatus = async () => {
    try {
      const data = await satelliteService.getSARSyncStatus(activeProfile?.id)
      setSarData(data)
    } catch (e) {
      console.error('Failed to fetch SAR status:', e)
    }
  }

  const triggerSARSync = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      await satelliteService.syncSAR(activeProfile?.id)
      // Backend queues the job and returns immediately — keep loading
      // state visible until the follow-up status fetch completes.
      setTimeout(async () => {
        await fetchSARStatus()
        setSyncing(false)
      }, 3000)
    } catch (e) {
      console.error('SAR sync failed:', e)
      setSyncing(false)
    }
  }

  if (!sarData?.has_sar_data && !showProminent) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-bg-border bg-bg-card p-4">
        {syncing && (
          <>
            <style dangerouslySetInnerHTML={{ __html: PROGRESS_KEYFRAMES }} />
            <div className="absolute inset-x-0 top-0 h-0.5 bg-accent/20">
              <div
                className="absolute inset-y-0 w-2/5 rounded-full bg-accent"
                style={{ animation: 'sarProgress 1.6s ease-in-out infinite' }}
              />
            </div>
          </>
        )}
        <div className="flex items-center gap-2 text-text-muted">
          <Radar className="h-5 w-5" />
          <span className="text-sm">SAR (Radar) data not yet synced</span>
        </div>
        <button
          onClick={triggerSARSync}
          disabled={syncing}
          className="mt-3 flex items-center gap-2 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Syncing SAR...
            </>
          ) : (
            '📡 Fetch SAR Data (Cloud-Free)'
          )}
        </button>
        {syncing && (
          <p className="mt-2 text-[11px] text-text-muted">
            Retrieving Sentinel-1 radar data — this may take a moment…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border ${showProminent ? 'border-accent bg-accent/5' : 'border-bg-border bg-bg-card'} p-4`}>
      {syncing && (
        <>
          <style dangerouslySetInnerHTML={{ __html: PROGRESS_KEYFRAMES }} />
          <div className="absolute inset-x-0 top-0 h-0.5 bg-accent/20">
            <div
              className="absolute inset-y-0 w-2/5 rounded-full bg-accent"
              style={{ animation: 'sarProgress 1.6s ease-in-out infinite' }}
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className={`h-5 w-5 ${showProminent ? 'text-accent' : 'text-text-muted'}`} />
          <span className="font-medium text-text-primary">Sentinel-1 SAR (Radar)</span>
          {showProminent && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
              CLOUD-FREE
            </span>
          )}
        </div>
        <button
          onClick={triggerSARSync}
          disabled={syncing}
          className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Syncing…
            </>
          ) : (
            '🔄 Refresh'
          )}
        </button>
      </div>

      {syncing && (
        <p className="mt-2 text-[11px] text-text-muted">
          Retrieving Sentinel-1 radar data — this may take a moment…
        </p>
      )}

      {sarData?.has_sar_data ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded bg-bg-secondary p-2">
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Sprout className="h-3 w-3" />
              Vegetation Index (RVI)
            </div>
            <div className="mt-1 text-lg font-bold text-text-primary">
              {sarData.latest_rvi?.toFixed(2) ?? '—'}
            </div>
            <div className="text-[10px] text-text-muted">
              {sarData.latest_rvi && sarData.latest_rvi > 0.6 ? '🌿 Dense' :
               sarData.latest_rvi && sarData.latest_rvi > 0.4 ? '🌱 Moderate' :
               sarData.latest_rvi ? '🌾 Sparse' : 'Unknown'}
            </div>
          </div>

          <div className="rounded bg-bg-secondary p-2">
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Droplets className="h-3 w-3" />
              Soil Moisture
            </div>
            <div className="mt-1 text-lg font-bold text-text-primary">
              {sarData.latest_vv && sarData.latest_vv > -12 ? '💧 Wet' :
               sarData.latest_vv && sarData.latest_vv > -18 ? '💦 Moist' :
               sarData.latest_vv ? '🏜️ Dry' : '—'}
            </div>
            <div className="text-[10px] text-text-muted">
              From VV backscatter
            </div>
          </div>

          <div className="rounded bg-bg-secondary p-2">
            <div className="text-[10px] text-text-muted">VV Backscatter</div>
            <div className="text-sm font-medium text-text-primary">
              {sarData.latest_vv?.toFixed(1) ?? '—'} dB
            </div>
          </div>

          <div className="rounded bg-bg-secondary p-2">
            <div className="text-[10px] text-text-muted">VH Backscatter</div>
            <div className="text-sm font-medium text-text-primary">
              {sarData.latest_vh?.toFixed(1) ?? '—'} dB
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded bg-bg-secondary p-3 text-center">
          <CloudRain className="mx-auto h-8 w-8 text-text-muted" />
          <p className="mt-2 text-sm text-text-secondary">
            Optical satellite blocked by clouds?
          </p>
          <p className="text-xs text-text-muted">
            SAR radar sees through clouds and at night!
          </p>
          <button
            onClick={triggerSARSync}
            disabled={syncing}
            className="mt-3 flex items-center justify-center gap-2 rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Fetching SAR Data…
              </>
            ) : (
              '📡 Get Cloud-Free SAR Data'
            )}
          </button>
        </div>
      )}

      {sarData?.latest_observation_date && (
        <div className="mt-3 text-[10px] text-text-muted">
          Latest SAR observation: {new Date(sarData.latest_observation_date).toLocaleDateString()}
          <span className="ml-2 text-accent">✓ Works through clouds!</span>
        </div>
      )}
    </div>
  )
}
