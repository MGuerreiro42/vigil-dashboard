import { create } from 'zustand'

interface GeoCoords {
  lat: number
  lng: number
}

interface GeoState {
  coords: GeoCoords | null
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'error'
  error: string | null
  /** Set when the user picks a city; geolocation no longer overrides it */
  placeName: string | null
  requestPermission: () => void
  setPlace: (place: { name: string; lat: number; lng: number }) => void
}

export const useGeoStore = create<GeoState>((set) => ({
  coords: null,
  status: 'idle',
  error: null,
  placeName: null,
  requestPermission: () => {
    if (!navigator.geolocation) {
      set({ status: 'error', error: 'Geolocation not supported' })
      return
    }
    set({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set((state) => state.placeName ? { status: 'granted' } : {
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          status: 'granted',
          error: null,
        })
      },
      (err) => {
        set({ status: 'denied', error: err.message })
      },
      { timeout: 10_000 }
    )
  },
  setPlace: (place) => set({ coords: { lat: place.lat, lng: place.lng }, placeName: place.name }),
}))
