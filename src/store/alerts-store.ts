import { create } from 'zustand'

export type AlertType = 'price_spike' | 'earthquake' | 'air_quality' | 'geomagnetic' | 'anomaly'
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
  /** Ids the user dismissed, so a producer re-running on fresh data does not bring them back */
  dismissedIds: string[]
  /** A stable `id` dedupes: an alert already listed is ignored */
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'> & { id?: string }) => void
  markAllRead: () => void
  dismiss: (id: string) => void
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  dismissedIds: [],

  addAlert: (alert) => {
    if (alert.id && (get().dismissedIds.includes(alert.id) || get().alerts.some((existing) => existing.id === alert.id))) return
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

  dismiss: (id) => {
    set((state) => {
      const dismissed = state.alerts.find((existing) => existing.id === id)
      if (!dismissed) return state
      return {
        alerts: state.alerts.filter((existing) => existing.id !== id),
        unreadCount: state.unreadCount - (dismissed.read ? 0 : 1),
        dismissedIds: [...state.dismissedIds, id],
      }
    })
  },
}))
