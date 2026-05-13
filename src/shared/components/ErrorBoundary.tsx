import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — catches render errors in child components
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
          <h3 className="mb-1 text-base font-semibold text-red-300">
            რაღაც არასწორად წავიდა
          </h3>
          <p className="mb-4 max-w-md text-sm text-red-200/70">
            კომპონენტის ჩატვირთვისას მოხდა შეცდომა. სცადეთ გვერდის განახლება.
          </p>
          {this.state.error && (
            <pre className="mb-4 max-w-full overflow-auto rounded bg-black/30 px-3 py-2 text-left text-xs text-red-200/60">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30"
          >
            <RefreshCw className="h-4 w-4" />
            ხელახლა ცდა
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight error boundary for inline/small components.
 */
export function InlineErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
          ⚠️ კომპონენტი ვერ ჩაიტვირთა
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
