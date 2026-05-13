import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Satellite, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/shared/stores'

export default function Login(): React.ReactElement {
  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/dashboard', { replace: true })
      } else {
        await register(email, password, fullName, orgName)
        navigate('/profile-setup', { replace: true })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (): void => {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError(null)
    setEmail('')
    setPassword('')
    setFullName('')
    setOrgName('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-bg-primary">
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sensor/5 rounded-full blur-3xl" />
      </div>

      {/* Scan line effect */}
      <div className="scan-line" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover shadow-glow">
            <Satellite className="h-8 w-8 text-base-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display tracking-tight">AgroCareGeo</h1>
          <p className="mt-1 text-sm text-text-muted font-mono tracking-wider">SATELLITE COMMAND CENTER</p>
        </div>

        {/* Card */}
        <div className="card card-gradient-border relative">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-text-primary font-display">
              {mode === 'login' ? 'შედით სისტემაში' : 'შექმენით ანგარიში'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {mode === 'login'
                ? 'შეიყვანეთ სახელი და პაროლი პლატფორმაზე შესასვლელად'
                : 'დარეგისტრირეთ ორგანიზაცია დასაწყებად'}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-danger/10 border border-danger/30 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="label" htmlFor="fullName">
                    სრული სახელი
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="input"
                    placeholder="გიორგი მაისურაძე"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="orgName">
                    ორგანიზაციის სახელი
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    className="input"
                    placeholder="ჩემი ფერმა შპს"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    autoComplete="organization"
                  />
                </div>
              </>
            )}

            <div>
              <label className="label" htmlFor="email">
                ელ. ფოსტა
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                პაროლი
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={mode === 'register' ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="mt-1 text-xs text-text-muted">მინიმუმ 8 სიმბოლო</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-primary/30 border-t-base-primary" />
                  <span>{mode === 'login' ? 'შესვლა...' : 'ანგარიშის შექმნა...'}</span>
                </>
              ) : mode === 'login' ? (
                'შესვლა'
              ) : (
                'ანგარიშის შექმნა'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 text-center border-t border-white/5">
            <p className="text-sm text-text-secondary">
              {mode === 'login' ? 'არ გაქვთ ანგარიში?' : 'უკვე გაქვთ ანგარიში?'}
              <button
                onClick={switchMode}
                className="ml-1.5 font-medium text-accent hover:text-accent-hover transition-colors"
              >
                {mode === 'login' ? 'რეგისტრაცია' : 'შესვლა'}
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted font-mono">
          Powered by Sentinel-2 Satellite & Open-Meteo Weather Intelligence
        </p>
      </div>
    </div>
  )
}
