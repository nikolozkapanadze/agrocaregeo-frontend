import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Leaf,
  Sprout,
  Wind,
  Settings,
  Zap,
} from 'lucide-react'
import { api } from '@/shared/api/client'
import AIAgentSettings from './AIAgentSettings'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  structured?: AIAnalysisResponse
  loading?: boolean
}

interface AIAnalysisResponse {
  summary?: string
  crop_analysis?: Array<{
    crop: string
    status: string
    issues: string[]
    actions: string[]
  }> | undefined
  questions?: Array<{
    question: string
    reason: string
  }>
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    detail: string
    timing: string
  }> | undefined
  confidence?: number
  fallback?: boolean
  _meta?: {
    parcel_count?: number
    crop_types?: string[]
    analyzed_at?: string
    llm_used?: boolean
  }
}

interface AIAgentPanelProps {
  cropType?: string | null
  parcelId?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const priorityColors: Record<string, string> = {
  high: 'border-l-danger bg-danger/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-info bg-info/5',
}

const priorityBadgeColors: Record<string, string> = {
  high: 'bg-danger/20 text-danger',
  medium: 'bg-warning/20 text-warning',
  low: 'bg-info/20 text-info',
}

const statusIcons: Record<string, React.ReactNode> = {
  კარგი: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  საშუალო: <Info className="h-4 w-4 text-warning" />,
  ცუდი: <AlertTriangle className="h-4 w-4 text-danger" />,
}

function CropAnalysisCard({ analysis }: { analysis: NonNullable<AIAnalysisResponse['crop_analysis']>[number] }) {
  const statusKey = analysis.status?.includes('კარგი') ? 'კარგი' :
    analysis.status?.includes('ცუდი') ? 'ცუდი' : 'საშუალო'

  return (
    <div className="rounded-xl border border-white/10 bg-bg-card/60 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-text-primary">{analysis.crop}</span>
        <span className="ml-auto flex items-center gap-1 text-xs text-text-secondary">
          {statusIcons[statusKey] || <Info className="h-4 w-4 text-text-muted" />}
          {analysis.status}
        </span>
      </div>

      {analysis.issues && analysis.issues.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-danger font-semibold">პრობლემები</p>
          <ul className="space-y-0.5">
            {analysis.issues.map((issue: string, i: number) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <AlertTriangle className="h-3 w-3 text-danger shrink-0 mt-0.5" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.actions && analysis.actions.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">რეკომენდაციები</p>
          <ul className="space-y-0.5">
            {analysis.actions.map((action: string, i: number) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <CheckCircle2 className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RecommendationCard({ rec }: { rec: NonNullable<AIAnalysisResponse['recommendations']>[number] }) {
  return (
    <div className={`rounded-xl border-l-4 p-3 ${priorityColors[rec.priority] || priorityColors.medium}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${priorityBadgeColors[rec.priority] || priorityBadgeColors.medium}`}>
          {rec.priority === 'high' ? 'მაღალი' : rec.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
        </span>
        <span className="text-sm font-semibold text-text-primary">{rec.title}</span>
      </div>
      <p className="text-xs text-text-secondary mb-1.5">{rec.detail}</p>
      {rec.timing && (
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Wind className="h-3 w-3" />
          <span>ტაიმინგი: {rec.timing}</span>
        </div>
      )}
    </div>
  )
}

function StructuredMessage({ data }: { data: AIAnalysisResponse }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      {data.summary && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">შეჯამება</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Fallback warning */}
      {data.fallback && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-warning shrink-0" />
          <span className="text-xs text-warning">
            AI API გასაღები არ არის კონფიგურირებული — ეს არის ავტომატური ანალიზი.
          </span>
        </div>
      )}

      {/* Crop Analysis */}
      {data.crop_analysis && data.crop_analysis.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">კულტურების ანალიზი</p>
          {data.crop_analysis.map((ca, i) => (
            <CropAnalysisCard key={i} analysis={ca} />
          ))}
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">რეკომენდაციები</p>
          {data.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {/* Questions */}
      {data.questions && data.questions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">დამაზუსტებელი კითხვები</p>
          <div className="space-y-2">
            {data.questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium text-text-primary mb-1">{q.question}</p>
                <p className="text-xs text-text-muted">{q.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta */}
      {data._meta && (
        <div className="flex items-center gap-3 text-[10px] text-text-muted pt-2 border-t border-white/5">
          <span>{data._meta.parcel_count} ნაკვეთი</span>
          <span>•</span>
          <span>{data._meta.crop_types?.join(', ')}</span>
          {data.confidence !== undefined && (
            <>
              <span>•</span>
              <span>სანდოობა: {data.confidence}%</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function AIAgentPanel({ cropType, parcelId, open: controlledOpen, onOpenChange }: AIAgentPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(v)
    onOpenChange?.(v)
  }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check AI config status
  useEffect(() => {
    if (isOpen && aiConfigured === null) {
      api.get<{ configured: boolean }>('/ai-agent/status')
        .then(data => setAiConfigured(data.configured))
        .catch(() => setAiConfigured(false))
    }
  }, [isOpen, aiConfigured])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (!isOpen) return
    const timeoutId = setTimeout(() => inputRef.current?.focus(), 200)
    if (messages.length === 0) {
      runAnalysis()
    }
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const runAnalysis = async (question?: string) => {
    setIsLoading(true)

    if (question) {
      setMessages(prev => [...prev, { role: 'user', content: question }])
    }

    // Add loading message
    const loadingMsg: ChatMessage = { role: 'assistant', content: '', loading: true }
    setMessages(prev => [...prev, loadingMsg])

    try {
      const payload: Record<string, unknown> = {}
      if (cropType) payload.crop_type = cropType
      if (parcelId) payload.parcel_id = parcelId
      if (question) payload.question = question

      const data = await api.post<AIAnalysisResponse>('/ai-agent/analyze', payload)

      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.loading)
        return [...withoutLoading, {
          role: 'assistant',
          content: data.summary || 'ანალიზი დასრულდა.',
          structured: data,
        }]
      })
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'შეცდომა მოთხოვნის დროს'
      setMessages(prev => {
        const withoutLoading = prev.filter(m => !m.loading)
        return [...withoutLoading, {
          role: 'assistant',
          content: `❌ ${errorMsg}`,
        }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const q = input.trim()
    setInput('')
    runAnalysis(q)
  }

  const handleQuestionClick = (q: string) => {
    if (isLoading) return
    runAnalysis(q)
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-full px-4 py-3 shadow-2xl transition-all duration-300 hover:scale-105 ${
          isOpen
            ? 'bg-text-muted text-white'
            : 'bg-gradient-to-r from-accent to-accent-hover text-white'
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        <span className="text-sm font-semibold hidden sm:inline">
          {isOpen ? 'დახურვა' : 'AI ასისტენტი'}
        </span>
      </button>

      {/* Slide-out panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[199] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative flex h-full w-full max-w-lg flex-col bg-bg-card border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 bg-bg-card/80 backdrop-blur-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-hover shadow-glow">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-text-primary">AI აგრონომ-ასისტენტი</h3>
                <p className="text-[10px] text-text-muted truncate">
                  {cropType ? `კულტურა: ${cropType}` : 'ყველა კულტურა'} • რეალური მონაცემების ანალიზი
                </p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-white/5 hover:text-text-primary transition-colors"
                title="AI Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-white/5 hover:text-text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Settings overlay */}
            {showSettings && (
              <div className="absolute inset-0 z-10 bg-bg-card overflow-y-auto p-5">
                <AIAgentSettings onClose={() => setShowSettings(false)} />
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Prominent config banner when AI not active */}
              {aiConfigured === false && (
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                      <Zap className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary">AI ასისტენტი არ არის აქტივირებული</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        ახლა მუშაობს ავტომატური (fallback) რეჟიმში. ჩართეთ LLM-ი რეალური AI ანალიზისთვის.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition-all shadow-glow"
                  >
                    <Settings className="h-4 w-4" />
                    AI პროვაიდერის არჩევა და კონფიგურაცია
                  </button>
                </div>
              )}

              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-text-muted">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                    <Sprout className="h-8 w-8 text-accent/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-text-secondary">AI ასისტენტი</p>
                    <p className="text-xs max-w-[260px]">
                      დასვით კითხვა თქვენი ფერმერული მონაცემების შესახებ ან მიიღეთ ავტომატური ანალიზი
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      'რა მდგომარეობაშია ჩემი ნაკვეთები?',
                      'როდის უნდა შევიტანო სასუქი?',
                      'გვიან დათესვის რისკები?',
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => handleQuestionClick(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-text-secondary hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-white/10'
                      : 'bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4 text-text-secondary" />
                    ) : (
                      <Bot className="h-4 w-4 text-accent" />
                    )}
                  </div>

                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {msg.loading ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-bg-card/60 px-4 py-3">
                        <Loader2 className="h-4 w-4 text-accent animate-spin" />
                        <span className="text-sm text-text-secondary">მონაცემების ანალიზი...</span>
                      </div>
                    ) : msg.structured && msg.role === 'assistant' ? (
                      <div className="text-left">
                        <StructuredMessage data={msg.structured} />
                      </div>
                    ) : (
                      <div className={`inline-block rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent/20 text-text-primary border border-accent/20'
                          : 'bg-bg-card/60 text-text-secondary border border-white/10'
                      }`}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 px-5 py-4 bg-bg-card/80 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="დასვით კითხვა..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-text-muted text-center">
                AI ანალიზი ეყრდნობა რეალურ სატელიტურ, ამინდის, მინერალურ და ფენოლოგიურ მონაცემებს
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for using the panel from any component
export function useAIAgent() {
  const [open, setOpen] = useState(false)
  return { open, setOpen, AIAgentPanel }
}
