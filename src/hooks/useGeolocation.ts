import { useEffect } from 'react'
import { useGeoStore } from '@/store/geo.store'

export function useGeolocation() {
  const status = useGeoStore((state) => state.status)
  const requestPermission = useGeoStore((state) => state.requestPermission)

  useEffect(() => {
    if (status === 'idle') {
      requestPermission()
    }
  }, [status, requestPermission])
}
