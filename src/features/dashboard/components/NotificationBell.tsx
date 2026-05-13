import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { notifications as notifApi, type Notification } from '@/shared/lib/api'

const severityIcon = (severity: string): React.ReactElement => {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-zone-medium" aria-hidden="true" />
    default:
      return <Info className="h-4 w-4 text-sensor" aria-hidden="true" />
  }
}

const formatTime = (iso: string): string => {
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ახლახან'
  if (mins < 60) return `${mins}წთ წინ`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}სთ წინ`
  return date.toLocaleDateString()
}

export default function NotificationBell(): React.ReactElement {
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifList, setNotifList] = useState<Notification[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchUnread = async (): Promise<void> => {
    try {
      const res = await notifApi.unreadCount()
      setUnreadCount(res.count)
    } catch {
      // silently ignore - not critical UI
    }
  }

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleOpen = async (): Promise<void> => {
    setOpen((prev) => !prev)
    if (!open) {
      setLoadingList(true)
      try {
        const res = await notifApi.list(1)
        setNotifList(res.items)
      } catch {
        setNotifList([])
      } finally {
        setLoadingList(false)
      }
    }
  }

  const handleMarkRead = async (id: string): Promise<void> => {
    try {
      await notifApi.markRead(id)
      setNotifList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-border hover:text-text-primary"
        aria-label="შეტყობინებები"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white" aria-label={`${unreadCount} წაუკითხავი შეტყობინება`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div 
          className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-bg-border bg-bg-card shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="შეტყობინებები"
        >
          <div className="flex items-center justify-between border-b border-bg-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary" id="notification-title">შეტყობინებები</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-text-muted hover:text-text-primary"
              aria-label="დახურვა"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loadingList ? (
              <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-14 rounded" />
                ))}
              </div>
            ) : notifList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-text-muted">
                <Bell className="h-8 w-8 opacity-40" />
                <p className="text-sm">შეტყობინება არ არის</p>
              </div>
            ) : (
              notifList.map((notif) => (
                <article
                  key={notif.id}
                  className={`flex gap-3 border-b border-bg-border px-4 py-3 transition-colors hover:bg-bg-primary ${
                    !notif.is_read ? 'bg-blue-950/20' : ''
                  }`}
                  aria-label={`${notif.title} - ${notif.severity}`}
                >
                  <div className="mt-0.5 shrink-0">{severityIcon(notif.severity)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{notif.body}</p>
                    <time className="mt-1 text-xs text-text-muted block">{formatTime(notif.created_at)}</time>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="mt-0.5 shrink-0 text-text-muted hover:text-sensor"
                      aria-label="წაკითხულად მონიშვნა"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </article>
              ))
            )}
          </div>

          {notifList.length > 0 && (
            <div className="border-t border-bg-border px-4 py-2">
              <p className="text-xs text-text-muted">
                ნაჩვენებია უახლესი {notifList.length} შეტყობინება
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
