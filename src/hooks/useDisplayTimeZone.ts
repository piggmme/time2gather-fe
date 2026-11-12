import { useStore } from '@nanostores/react'
import { $displayTimeZones, displayTimeZoneKey, setDisplayTimeZone } from '../stores/timezone'

export function useDisplayTimeZone (sourceZone: string) {
  const overrides = useStore($displayTimeZones)
  const key = displayTimeZoneKey(sourceZone, typeof window === 'undefined' ? '' : window.location.pathname)
  return [overrides[key] ?? sourceZone, (zone: string) => setDisplayTimeZone(key, zone)] as const
}
