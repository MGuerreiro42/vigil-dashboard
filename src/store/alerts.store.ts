import { create } from 'zustand'

export type AlertType = 'price_spike' | 'earthquake' | 'air_quality' | 'anomaly'
export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  type: AlertType
  title: string
  body: string
  severity: AlertSeverity
  timestamp: number
  read: boolean
  sourceWidget: string
}

interface AlertsState {
  alerts: Alert[]
  unreadCount: number
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearOld: () => void
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      read: false,
    }
    set((s) => ({
      alerts: [newAlert, ...s.alerts].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    }))

    if (alert.severity === 'critical' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, { body: alert.body, icon: '/favicon.ico' })
    }
  },

  markRead: (id) => {
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllRead: () => {
    set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })), unreadCount: 0 }))
  },

  clearOld: () => {
    const oneHourAgo = Date.now() - 60 * 60_000
    const { alerts } = get()
    const fresh = alerts.filter((a) => a.timestamp > oneHourAgo)
    set({ alerts: fresh, unreadCount: fresh.filter((a) => !a.read).length })
  },
}))
