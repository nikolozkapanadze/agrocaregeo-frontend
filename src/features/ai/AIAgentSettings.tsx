import React, { useState, useEffect } from 'react'
import {
  Bot,
  Check,
  AlertTriangle,
  Loader2,
  Key,
  TestTube,
  Save,
  Info,
  Eye,
  EyeOff,
  Globe,
  Cpu,
  Settings2,
} from 'lucide-react'
import { api } from '@/shared/api/client'

interface AIProviderPreset {
  name: string
  api_url: string
  model: string
}

interface AIConfig {
  provider: string | null
  api_url: string | null
  model: string | null
  is_active: boolean
  configured: boolean
  presets: Record<string, AIProviderPreset>
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  kimi: <Bot className="h-5 w-5 text-purple-400" />,
  openai: <Bot className="h-5 w-5 text-emerald-400" />,
  deepseek: <Bot className="h-5 w-5 text-blue-400" />,
  local: <Cpu className="h-5 w-5 text-orange-400" />,
  custom: <Settings2 className="h-5 w-5 text-text-muted" />,
}

export default function AIAgentSettings({ onClose }: { onClose?: () => void }): React.ReactElement {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Only for custom provider
  const [customUrl, setCustomUrl] = useState('')
  const [customModel, setCustomModel] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const data = await api.get<AIConfig>('/ai-agent/config')
      setConfig(data)
      setProvider(data.provider || '')
      setIsActive(data.is_active)
      // Don't populate api_key for security (server won't return it)
      setApiKey('')
      // If provider is custom (not in presets), populate custom fields from saved config
      const presets = data.presets || {}
      if (data.provider && !presets[data.provider]) {
        setCustomUrl(data.api_url || '')
        setCustomModel(data.model || '')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetSelect = (presetKey: string) => {
    setProvider(presetKey)
    setError(null)
    setSuccess(null)
  }

  const resolvedPreset = config?.presets?.[provider]
  const isCustom = provider === 'custom' || (provider && !config?.presets?.[provider])

  const handleTest = async () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) {
      setError('Please enter your API key before testing')
      return
    }
    if (!provider) {
      setError('Please select a provider')
      return
    }
    setTesting(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: Record<string, unknown> = {
        provider,
        api_key: trimmedKey,
      }
      if (isCustom) {
        payload.api_url = customUrl.trim()
        payload.model = customModel.trim()
      }
      const result = await api.post<{
        success: boolean
        response_preview?: string
        error?: string
      }>('/ai-agent/config/test', payload)
      if (result.success) {
        setSuccess(`Connection OK! Response: "${result.response_preview?.slice(0, 80)}..."`)
      } else {
        setError(`Connection failed: ${result.error}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: Record<string, unknown> = {
        provider: provider || 'openai',
        api_key: apiKey.trim() || undefined,
        is_active: isActive,
      }
      if (isCustom) {
        payload.api_url = customUrl.trim()
        payload.model = customModel.trim()
      }
      await api.put('/ai-agent/config', payload)
      setSuccess('Configuration saved successfully')
      await fetchConfig()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-accent animate-spin" />
        <span className="ml-2 text-sm text-text-secondary">Loading AI settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover shadow-glow">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">AI Provider Settings</h2>
          <p className="text-xs text-text-muted">Select provider, paste your key, and go</p>
        </div>
        {config?.configured && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <Check className="h-3 w-3" /> Active
          </span>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-start gap-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Provider selection cards */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-text-secondary">Select Provider</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(config?.presets || {}).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetSelect(key)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                provider === key
                  ? 'border-accent bg-accent/10 shadow-glow'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                provider === key ? 'bg-accent/20' : 'bg-white/5'
              }`}>
                {PROVIDER_ICONS[key] || <Bot className="h-5 w-5 text-text-muted" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">{preset.name}</p>
                <p className="text-[10px] text-text-muted truncate">{preset.model}</p>
              </div>
              {provider === key && (
                <Check className="ml-auto h-4 w-4 text-accent shrink-0" />
              )}
            </button>
          ))}
          <button
            onClick={() => handlePresetSelect('custom')}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
              provider === 'custom'
                ? 'border-accent bg-accent/10 shadow-glow'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              provider === 'custom' ? 'bg-accent/20' : 'bg-white/5'
            }`}>
              {PROVIDER_ICONS.custom}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Custom / Other</p>
              <p className="text-[10px] text-text-muted truncate">Bring your own URL and model</p>
            </div>
            {provider === 'custom' && (
              <Check className="ml-auto h-4 w-4 text-accent shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Configuration form */}
      <div className="space-y-4 rounded-xl border border-white/10 bg-bg-card/50 p-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
            <Key className="h-4 w-4 text-accent" /> API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              name="ai-provider-api-key"
              autoComplete="new-password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'kimi' ? 'Kimi API key' : provider === 'deepseek' ? 'DeepSeek API key' : provider === 'local' ? 'Local key (optional)' : 'sk-...'}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              tabIndex={-1}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-text-muted">
            Leave empty to keep existing key. For security, the server never returns stored keys.
          </p>
        </div>

        {/* Show resolved preset info */}
        {resolvedPreset && (
          <div className="space-y-1 rounded-lg bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <Globe className="h-3 w-3" />
              <span className="truncate">{resolvedPreset.api_url}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-text-muted">
              <Cpu className="h-3 w-3" />
              <span>{resolvedPreset.model}</span>
            </div>
          </div>
        )}

        {/* Custom provider fields */}
        {isCustom && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" /> API URL
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Cpu className="h-4 w-4 text-accent" /> Model
              </label>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="gpt-4o, kimi-latest, deepseek-chat..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? 'bg-accent' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-text-secondary">Activate AI agent</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !apiKey.trim() || !provider}
          className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/20 disabled:opacity-40 transition-all"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
          Test Connection
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-40 transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Configuration
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Info className="h-4 w-4 text-accent" />
          <span className="font-semibold text-text-secondary">How it works</span>
        </div>
        <ul className="space-y-1 text-xs text-text-muted list-disc list-inside">
          <li>Select a provider — URL and model are set automatically</li>
          <li>Paste your API key (stored encrypted per-tenant)</li>
          <li>Click <strong>Test Connection</strong> to verify the key works</li>
          <li>Toggle <strong>Activate</strong> and save — AI starts working immediately</li>
          <li>If no provider is active, the agent uses rule-based fallback analysis</li>
        </ul>
      </div>
    </div>
  )
}
