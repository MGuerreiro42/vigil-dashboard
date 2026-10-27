import { beforeEach, expect, it } from 'vitest'
import { useAlertsStore } from './alerts-store'

const quake = {
  id: 'earthquake-us123',
  type: 'earthquake' as const,
  severity: 'warning' as const,
  timestamp: 1,
  params: { magnitude: '6.2', place: 'Off the coast of Chile' },
}

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], unreadCount: 0, dismissedIds: [] })
})

it('ignores an alert whose id is already listed', () => {
  const { addAlert } = useAlertsStore.getState()
  addAlert(quake)
  addAlert(quake)
  expect(useAlertsStore.getState()).toMatchObject({ unreadCount: 1, alerts: [{ id: 'earthquake-us123' }] })
})

it('dismisses an alert for good', () => {
  const { addAlert, dismiss } = useAlertsStore.getState()
  addAlert(quake)
  dismiss('earthquake-us123')
  addAlert(quake)
  expect(useAlertsStore.getState()).toMatchObject({ unreadCount: 0, alerts: [] })
})

it('keeps dismissed ids across a reload', () => {
  const { addAlert, dismiss } = useAlertsStore.getState()
  addAlert(quake)
  dismiss('earthquake-us123')
  expect(JSON.parse(localStorage.getItem('vigil-dismissed-alerts') ?? '{}').state).toEqual({ dismissedIds: ['earthquake-us123'] })
})
