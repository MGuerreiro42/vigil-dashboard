import { beforeEach, expect, it } from 'vitest'
import { useAlertsStore } from './alerts.store'

const quake = {
  type: 'earthquake' as const,
  title: 'Terremoto M6.2',
  body: 'Off the coast of Chile',
  severity: 'warning' as const,
  sourceWidget: 'earthquakes',
}

beforeEach(() => {
  useAlertsStore.setState({ alerts: [], unreadCount: 0 })
})

it('ignores an alert whose id is already listed', () => {
  const { addAlert } = useAlertsStore.getState()
  addAlert({ ...quake, id: 'earthquake-us123' })
  addAlert({ ...quake, id: 'earthquake-us123' })
  expect(useAlertsStore.getState()).toMatchObject({ unreadCount: 1, alerts: [{ id: 'earthquake-us123' }] })
})

it('keeps alerts without an id', () => {
  const { addAlert } = useAlertsStore.getState()
  addAlert(quake)
  addAlert(quake)
  expect(useAlertsStore.getState().unreadCount).toBe(2)
})
