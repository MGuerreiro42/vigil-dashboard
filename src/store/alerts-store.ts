import { create } from 'zustand'

export type AlertType = 'earthquake' | 'air_quality' | 'geomagnetic' | 'price_spike'
export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  /** Stable per fact (quake id, coin + day…), so producers re-running on fresh data do not duplicate it */
  id: string
  type: AlertType
  severity: AlertSeverity
  /** When the fact happened */
  timestamp: number
  /** Values for the `terminal.alerts.kinds.{type}` texts, translated when shown */
  params: Record<string, string | number>
  read: boolean
}

interface AlertsState {
  alerts: Alert[]
  unreadCount: number
  /** Ids the user dismissed, so a producer re-running on fresh data does not bring them back */
  dismissedIds: string[]
  /** An alert whose id is listed or was dismissed is ignored */
  addAlert: (alert: Omit<Alert, 'read'>) => void
  markAllRead: () => void
  dismiss: (id: string) => void
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  dismissedIds: [],

  addAlert: (alert) => {
    if (get().dismissedIds.includes(alert.id) || get().alerts.some((existing) => existing.id === alert.id)) return
    set((state) => ({
      alerts: [{ ...alert, read: false }, ...state.alerts].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }))
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
