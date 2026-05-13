import { useEffect, useState, useRef, useCallback } from 'react'
import {
  Send, CheckCircle, XCircle, RefreshCw, Clock,
  ExternalLink, AlertTriangle, Bot, Eye, EyeOff,
  ChevronDown, ChevronUp, Plus, Trash2, Power, Smartphone, Zap,
} from 'lucide-react'
import { telegramApi } from '@/shared/lib/api'
import type { TelegramBot, TelegramDevice } from '@/shared/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserStatus {
  connected: boolean
  bot_configured: boolean
  chats: TelegramDevice[]
}

interface LinkData {
  token: string
  link: string
  expires_in: number
}

// ── Sub-component: Instructions accordion ─────────────────────────────────────

function Instructions() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #21262d' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ background: '#161b22', color: '#e6edf3' }}
      >
        <span className="font-medium text-sm">📖 როგორ შევქმნა Telegram Bot და ვიღო Token?</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="px-4 py-4 space-y-4 text-sm" style={{ background: '#0d1117', color: '#8b949e' }}>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#e6edf3' }}>🤖 ნაბიჯი 1 — BotFather-ის გახსნა</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>გახსენით Telegram</li>
              <li>ძიებაში მოძებნეთ <code className="px-1 rounded" style={{ background: '#21262d', color: '#58a6ff' }}>@BotFather</code></li>
              <li>გახსენით ოფიციალური BotFather (ლურჯი ✓ ნიშნით)</li>
              <li>დააჭირეთ <strong style={{ color: '#e6edf3' }}>Start</strong></li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#e6edf3' }}>🆕 ნაბიჯი 2 — ახალი Bot-ის შექმნა</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>გაგზავნეთ ბრძანება: <code className="px-1 rounded" style={{ background: '#21262d', color: '#58a6ff' }}>/newbot</code></li>
              <li>BotFather გკითხავს Bot-ის სახელს — შეიყვანეთ, მაგ: <em>AgroCareGeo Alerts</em></li>
              <li>შემდეგ გკითხავს username-ს — უნდა მთავრდებოდეს <code className="px-1 rounded" style={{ background: '#21262d', color: '#58a6ff' }}>bot</code>-ით</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-2" style={{ color: '#e6edf3' }}>🔑 ნაბიჯი 3 — Token-ის მიღება</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>BotFather მოგცემს <strong style={{ color: '#e6edf3' }}>HTTP API Token</strong>-ს</li>
              <li>გამოიყურება ასე: <code className="px-1 rounded" style={{ background: '#21262d', color: '#58a6ff' }}>1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ</code></li>
              <li>დააკოპირეთ და ჩასვით ქვემოთ</li>
            </ol>
          </div>
          <div className="rounded p-3" style={{ background: '#161b22', border: '1px solid #f57c00' }}>
            <p className="font-semibold mb-1" style={{ color: '#f57c00' }}>⚠️ მნიშვნელოვანი</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Token-ი საიდუმლოა — არ გააზიაროთ სხვებთან</li>
              <li>Bot-ი შეიძლება გამოიყენოს თქვენი ორგანიზაციის ყველა მომხმარებელმა</li>
            </ul>
          </div>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm w-fit"
            style={{ color: '#58a6ff' }}
          >
            <ExternalLink size={14} />
            BotFather-ის გახსნა Telegram-ში
          </a>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: Single bot row ──────────────────────────────────────────────

function BotRow({
  bot,
  onDelete,
  onToggle,
}: {
  bot: TelegramBot
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Bot @${bot.bot_username || bot.token_hint}-ის წაშლა?`)) return
    setDeleting(true)
    try { await onDelete(bot.id) } finally { setDeleting(false) }
  }

  const handleToggle = async () => {
    setToggling(true)
    try { await onToggle(bot.id, !bot.is_active) } finally { setToggling(false) }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{ background: '#0d1117', border: `1px solid ${bot.is_active ? '#238636' : '#21262d'}` }}
    >
      {/* Status dot */}
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: bot.is_active ? '#388e3c' : '#6e7681' }}
      />

      {/* Bot info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#e6edf3' }}>
          {bot.bot_username ? `@${bot.bot_username}` : bot.token_hint}
        </p>
        <p className="text-xs" style={{ color: '#6e7681' }}>
          {bot.label ? `${bot.label} · ` : ''}{bot.token_hint}
          {!bot.is_active && <span style={{ color: '#8b949e' }}> · გათიშული</span>}
        </p>
      </div>

      {/* Toggle active */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        title={bot.is_active ? 'გათიშვა' : 'ჩართვა'}
        className="p-1.5 rounded"
        style={{
          color: bot.is_active ? '#388e3c' : '#6e7681',
          background: '#21262d',
          opacity: toggling ? 0.5 : 1,
        }}
      >
        <Power size={14} />
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="წაშლა"
        className="p-1.5 rounded"
        style={{ color: '#d32f2f', background: '#21262d', opacity: deleting ? 0.5 : 1 }}
      >
        {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  )
}

// ── Sub-component: Bot list card ───────────────────────────────────────────────

function BotListCard({ onConfigured }: { onConfigured: () => void }) {
  const [bots, setBots] = useState<TelegramBot[]>([])
  const [loading, setLoading] = useState(true)
  const [tokenInput, setTokenInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadBots = useCallback(async () => {
    try {
      const data = await telegramApi.listBots()
      setBots(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBots() }, [loadBots])

  const handleAdd = async () => {
    if (!tokenInput.trim()) return
    setAdding(true)
    setError('')
    setSuccess('')
    try {
      const bot = await telegramApi.addBot(tokenInput.trim(), labelInput.trim() || undefined)
      setSuccess(`✅ Bot @${bot.bot_username} წარმატებით დაემატა!`)
      setTokenInput('')
      setLabelInput('')
      await loadBots()
      onConfigured()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Token-ი არასწორია ან უკვე დამატებულია.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    await telegramApi.deleteBot(id)
    await loadBots()
    onConfigured()
  }

  const handleToggle = async (id: string, active: boolean) => {
    await telegramApi.toggleBot(id, active)
    await loadBots()
    onConfigured()
  }

  return (
    <div className="rounded-lg p-5 space-y-4" style={{ background: '#161b22', border: '1px solid #21262d' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} style={{ color: '#58a6ff' }} />
          <h2 className="font-semibold" style={{ color: '#e6edf3' }}>Telegram Bot-ები</h2>
        </div>
        {!loading && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#21262d', color: '#8b949e' }}>
            {bots.length} bot{bots.length !== 1 ? '' : ''}
          </span>
        )}
      </div>

      {/* Bot list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: '#21262d' }} />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="rounded-lg p-4 text-sm text-center" style={{ background: '#0d1117', border: '1px dashed #21262d', color: '#6e7681' }}>
          Bot არ არის დამატებული. დაამატეთ პირველი Bot ქვემოთ.
        </div>
      ) : (
        <div className="space-y-2">
          {bots.map(bot => (
            <BotRow key={bot.id} bot={bot} onDelete={handleDelete} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #21262d' }} />

      {/* Instructions */}
      <Instructions />

      {/* Add bot form */}
      <div className="space-y-2">
        <p className="text-sm font-medium" style={{ color: '#e6edf3' }}>ახალი Bot-ის დამატება</p>

        <div>
          <label className="block text-xs mb-1" style={{ color: '#8b949e' }}>Bot Token *</label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
              className="w-full rounded-lg px-3 py-2 pr-10 text-sm font-mono"
              style={{ background: '#0d1117', border: '1px solid #21262d', color: '#e6edf3', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowToken(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: '#8b949e' }}
            >
              {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1" style={{ color: '#8b949e' }}>მინიშნება (სურვილისამებრ)</label>
          <input
            type="text"
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="მაგ. მთავარი ბოტი, სატესტო"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: '#0d1117', border: '1px solid #21262d', color: '#e6edf3', outline: 'none' }}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={adding || !tokenInput.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center"
          style={{
            background: tokenInput.trim() ? '#58a6ff' : '#21262d',
            color: tokenInput.trim() ? '#0d1117' : '#8b949e',
            opacity: adding ? 0.6 : 1,
          }}
        >
          {adding ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          {adding ? 'მოწმდება...' : 'Bot-ის დამატება'}
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: '#d32f2f' }}>{error}</p>}
      {success && <p className="text-sm" style={{ color: '#388e3c' }}>{success}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TelegramConnect() {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [linkData, setLinkData] = useState<LinkData | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [expired, setExpired] = useState(false)
  const [bots, setBots] = useState<TelegramBot[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const s = await telegramApi.status()
      const prevCount = userStatus?.chats.length ?? 0
      setUserStatus(s)
      // Clear link only when a new device was added (chat count increased)
      if (s.chats.length > prevCount) {
        setLinkData(null)
        stopTimers()
      }
    } catch {
      // ignore
    } finally {
      setStatusLoading(false)
    }
  }, [stopTimers])

  useEffect(() => {
    fetchStatus()
    telegramApi.listBots().then(data => {
      setBots(data.filter(b => b.is_active))
      if (data.length > 0) setSelectedBotId(data[0].id)
    }).catch(() => {})
    return () => stopTimers()
  }, [fetchStatus, stopTimers])

  const handleGenerate = async () => {
    setGenerating(true)
    setExpired(false)
    try {
      const data = await telegramApi.generateLink(selectedBotId || undefined)
      setLinkData(data)
      setSecondsLeft(data.expires_in)
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            stopTimers()
            setExpired(true)
            setLinkData(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      pollRef.current = setInterval(fetchStatus, 5000)
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await telegramApi.sendTest()
      setTestResult(`✅ გაიგზავნა ${res.sent}/${res.devices} მოწყობილობაზე`)
    } catch (e) {
      setTestResult(`❌ ${e instanceof Error ? e.message : 'შეცდომა'}`)
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 6000)
    }
  }

  const handleDisconnectDevice = async (id: string) => {
    setDisconnecting(true)
    try {
      await telegramApi.disconnectDevice(id)
      await fetchStatus()
    } finally {
      setDisconnecting(false)
    }
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: '#8b949e' }}>
        <RefreshCw size={20} className="animate-spin mr-2" /> იტვირთება...
      </div>
    )
  }

  const chats = userStatus?.chats ?? []

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Send size={24} style={{ color: '#58a6ff' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#e6edf3' }}>Telegram-ის დაკავშირება</h1>
        </div>
        <p style={{ color: '#8b949e' }}>მიიღეთ სასოფლო-სამეურნეო შეტყობინებები პირდაპირ Telegram-ში</p>
      </div>

      {/* ── Section 1: Bot list management ── */}
      <BotListCard onConfigured={fetchStatus} />

      {/* ── Section 2: Personal connection ── */}
      <div className="rounded-lg p-5 space-y-4" style={{ background: '#161b22', border: '1px solid #21262d' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={20} style={{ color: '#58a6ff' }} />
            <h2 className="font-semibold" style={{ color: '#e6edf3' }}>დაკავშირებული მოწყობილობები</h2>
          </div>
          {chats.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#21262d', color: '#8b949e' }}>
                {chats.length} მოწყობილობა
              </span>
              <button
                onClick={handleTest}
                disabled={testing}
                title="სატესტო შეტყობინების გაგზავნა"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: '#21262d', color: '#58a6ff', opacity: testing ? 0.6 : 1 }}
              >
                {testing ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                {testing ? 'იგზავნება...' : 'ტესტი'}
              </button>
            </div>
          )}
        </div>

        {/* Bot not configured warning */}
        {!userStatus?.bot_configured && (
          <div className="rounded-lg p-4 flex gap-3" style={{ background: '#0d1117', border: '1px solid #f57c00' }}>
            <AlertTriangle size={18} style={{ color: '#f57c00', flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: '#8b949e' }}>
              ჯერ დაამატეთ Bot ზემოთ, შემდეგ შეძლებთ მოწყობილობების დაკავშირებას.
            </p>
          </div>
        )}

        {/* Connected devices list */}
        {chats.length > 0 && (
          <div className="space-y-2">
            {chats.map((device) => (
              <div
                key={device.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: '#0d1117', border: '1px solid #238636' }}
              >
                <CheckCircle size={16} style={{ color: '#388e3c', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#e6edf3' }}>
                    Chat ID: <span className="font-mono">{device.chat_id}</span>
                  </p>
                  <p className="text-xs" style={{ color: '#6e7681' }}>
                    {device.bot_username ? `@${device.bot_username} · ` : ''}
                    {formatDate(device.connected_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnectDevice(device.id)}
                  disabled={disconnecting}
                  title="გათიშვა"
                  className="p-1.5 rounded"
                  style={{ color: '#d32f2f', background: '#21262d', opacity: disconnecting ? 0.5 : 1 }}
                >
                  <XCircle size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {testResult && (
          <p className="text-sm" style={{ color: testResult.startsWith('✅') ? '#388e3c' : '#d32f2f' }}>
            {testResult}
          </p>
        )}

        {chats.length === 0 && userStatus?.bot_configured && (
          <p className="text-sm" style={{ color: '#8b949e' }}>
            მოწყობილობა არ არის დაკავშირებული. გენერირეთ ბმული ქვემოთ.
          </p>
        )}

        {/* Generate link — always visible when bot configured */}
        {userStatus?.bot_configured && (
          <div style={{ borderTop: chats.length > 0 ? '1px solid #21262d' : 'none', paddingTop: chats.length > 0 ? '1rem' : 0 }}>
            <p className="text-sm mb-3" style={{ color: '#8b949e' }}>
              {chats.length > 0
                ? 'მეორე მოწყობილობისთვის გენერირეთ ახალი ბმული — თითო მოწყობილობას სჭირდება ცალკე ბმული:'
                : 'დააჭირეთ ღილაკს, გახსენით Telegram და bot ავტომატურად დაგიკავშირდებათ:'}
            </p>

            {/* Bot selector — only show if multiple active bots exist */}
            {bots.length > 1 && !linkData && (
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: '#8b949e' }}>Bot-ის არჩევა</label>
                <select
                  value={selectedBotId}
                  onChange={e => setSelectedBotId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: '#0d1117', border: '1px solid #21262d', color: '#e6edf3', outline: 'none' }}
                >
                  {bots.map(b => (
                    <option key={b.id} value={b.id}>
                      @{b.bot_username ?? b.token_hint}{b.label ? ` — ${b.label}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {expired && (
              <p className="text-sm mb-2" style={{ color: '#d32f2f' }}>ვადა გასულია — გენერირეთ ახალი ბმული.</p>
            )}

            {!linkData ? (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
                style={{ background: '#58a6ff', color: '#0d1117', opacity: generating ? 0.6 : 1 }}
              >
                <Send size={15} />
                {generating ? 'იქმნება...' : 'ბმულის გენერირება'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg p-4" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
                  <p className="text-xs mb-1" style={{ color: '#8b949e' }}>თქვენი კოდი</p>
                  <p className="font-mono text-3xl font-bold tracking-widest" style={{ color: '#58a6ff' }}>
                    {linkData.token}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#8b949e' }}>
                    <Clock size={12} />
                    <span>ვადა: </span>
                    <span className="font-mono font-semibold" style={{ color: secondsLeft < 60 ? '#d32f2f' : '#e6edf3' }}>
                      {fmt(secondsLeft)}
                    </span>
                  </div>
                </div>

                <a
                  href={linkData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm w-fit"
                  style={{ background: '#229ED9', color: '#fff', textDecoration: 'none' }}
                >
                  <ExternalLink size={15} />
                  Telegram-ში გახსნა
                </a>

                <ol className="text-sm space-y-1 list-decimal list-inside" style={{ color: '#8b949e' }}>
                  <li>დააჭირეთ ზემოთ ღილაკს Telegram-ის გასახსნელად</li>
                  <li>Bot-ი ავტომატურად მიიღებს კოდს</li>
                  <li>ეს გვერდი ავტომატურად განახლდება</li>
                </ol>

                <button
                  onClick={fetchStatus}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#21262d', color: '#8b949e' }}
                >
                  <RefreshCw size={12} /> განახლება
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
