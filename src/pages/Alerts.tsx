/** Alerts page - Telegram + web notifications */
import { useState } from 'react'
import { Bell, Send, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface Alert {
  id: string
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
  crop: string
  parcel?: string
  timestamp: string
  read: boolean
  telegram_sent?: boolean
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'მილდიუს საფრთხე',
    message: 'ამინდის პირობები ხელსაყრელია მილდიუს განვითარებისთვის. რეკომენდირებულია სპრეი.',
    crop: 'ვენახი',
    parcel: 'ნაკვეთი #3',
    timestamp: '2026-04-04T10:30:00',
    read: false,
    telegram_sent: true,
  },
  {
    id: '2',
    type: 'info',
    title: 'NDVI განახლება',
    message: 'ახალი სატელიტური გადაღება ხელმისაწვდომია.',
    crop: 'ხორბალი',
    parcel: 'ნაკვეთი #1',
    timestamp: '2026-04-04T08:00:00',
    read: true,
  },
  {
    id: '3',
    type: 'success',
    title: 'სპრეი დასრულებულია',
    message: 'გეგმიური სპრეი წარმატებით ჩატარდა.',
    crop: 'თხილი',
    parcel: 'ნაკვეთი #2',
    timestamp: '2026-04-03T16:45:00',
    read: true,
    telegram_sent: true,
  },
]

export default function Alerts(): React.ReactElement {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'telegram'>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read
    if (filter === 'telegram') return alert.telegram_sent
    return true
  })

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, read: true } : a
    ))
  }

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />
      default: return <Info className="h-5 w-5 text-info" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">შეტყობინებები</h1>
          <p className="text-text-muted">
            Telegram და სისტემური შეტყობინებები
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-text-muted" />
          <span className="text-sm text-text-muted">
            {alerts.filter(a => !a.read).length} ახალი
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread', 'telegram'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === f 
                ? 'bg-accent text-white' 
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
              }
            `}
          >
            {f === 'all' && 'ყველა'}
            {f === 'unread' && 'წაუკითხავი'}
            {f === 'telegram' && 'Telegram'}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id}
            className={`
              p-4 rounded-xl border transition-all
              ${alert.read 
                ? 'bg-bg-card border-white/5' 
                : 'bg-accent/5 border-accent/20'
              }
            `}
          >
            <div className="flex items-start gap-4">
              {getIcon(alert.type)}
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-text-primary">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {alert.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {alert.telegram_sent && (
                      <div title="Telegram-ზე გაგზავნილი">
                        <Send className="h-4 w-4 text-success" />
                      </div>
                    )}
                    {!alert.read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs text-accent hover:underline"
                      >
                        წაკითხვა
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                  <span className="px-2 py-0.5 bg-white/5 rounded">
                    {alert.crop}
                  </span>
                  {alert.parcel && (
                    <span>{alert.parcel}</span>
                  )}
                  <span>{new Date(alert.timestamp).toLocaleString('ka-GE')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            შეტყობინებები არ არის
          </div>
        )}
      </div>
    </div>
  )
}
