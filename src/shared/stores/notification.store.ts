import { create } from 'zustand'
import type { Notification } from '../api/types'

interface NotificationState {
  // State
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setUnreadCount: (count: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Set all notifications
  setNotifications: (notifications) => set({ notifications }),

  // Add a new notification
  addNotification: (notification) => 
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  // Mark single notification as read
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  // Mark all as read
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })),

  // Set unread count directly
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Loading state
  setLoading: (loading) => set({ isLoading: loading }),

  // Error state
  setError: (error) => set({ error }),
}))

export default useNotificationStore
