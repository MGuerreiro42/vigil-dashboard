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
  /** A stable `id` dedupes: an alert already listed is ignored */
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'> & { id?: string }) => void
  markAllRead: () => void
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) => {
    if (alert.id && get().alerts.some((existing) => existing.id === alert.id)) return
    const newAlert: Alert = {
      ...alert,
      id: alert.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      read: false,
    }
    set((state) => ({
      alerts: [newAlert, ...state.alerts].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }))

    if (alert.severity === 'critical' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, { body: alert.body, icon: '/favicon.ico' })
    }
  },

  markAllRead: () => {
    set((state) => ({ alerts: state.alerts.map((existing) => ({ ...existing, read: true })), unreadCount: 0 }))
  },
}))
