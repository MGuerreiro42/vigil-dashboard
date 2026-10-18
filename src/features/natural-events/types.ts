export interface NaturalEvent {
  id: string
  title: string
  categoryId: string
  categoryTitle: string
  status: 'open' | 'closed'
  date: string
  lat: number
  lng: number
  sourceUrl: string | null
  magnitude: number | null
  magnitudeUnit: string | null
  description: string | null
  /** GDACS alert level (Green / Orange / Red); undefined when the feed omits it */
  alertLevel?: 'Green' | 'Orange' | 'Red'
  /** Country name from GDACS; undefined when the feed omits it */
  country?: string
  /** GDACS storm name, e.g. CHAMPI-26 */
  eventName?: string
}
