import { useEffect } from 'react'
import { useGeoStore } from '@/store/geo.store'

export function useGeolocation() {
  const { status, requestPermission } = useGeoStore()

  useEffect(() => {
    if (status === 'idle') {
      requestPermission()
    }
  }, [status, requestPermission])

  return useGeoStore()
}
