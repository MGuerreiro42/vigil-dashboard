import { create } from 'zustand'

interface GeoCoords {
  lat: number
  lng: number
}

interface GeoState {
  coords: GeoCoords | null
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'error'
  error: string | null
  requestPermission: () => void
}

export const useGeoStore = create<GeoState>((set) => ({
  coords: null,
  status: 'idle',
  error: null,
  requestPermission: () => {
    if (!navigator.geolocation) {
      set({ status: 'error', error: 'Geolocation not supported' })
      return
    }
    set({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
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
}))
