import { atom } from 'nanostores'
import { getDeviceTimeZone, isTimeZone } from '../utils/timezone'
// Display overrides belong to the current meeting and visit. Every new meeting
// starts in its own time zone, independent of the device or old preferences.
export const $displayTimeZones = atom<Record<string, string>>({})
export function displayTimeZoneKey (sourceZone: string, pathname: string) {
  const meetingPath = pathname.match(/\/meetings\/([^/]+)/)?.[1] ?? pathname
  return `${meetingPath}:${sourceZone}`
}
export function setDisplayTimeZone (key: string, zone: string) {
  if (!isTimeZone(zone)) return
  $displayTimeZones.set({ ...$displayTimeZones.get(), [key]: zone })
}

function initialCreationZone () {
  if (typeof window !== 'undefined') {
    try {
      const zone = sessionStorage.getItem('meetingDraft.timezone')
      if (zone && isTimeZone(zone)) return zone
    } catch { /* The current draft can work without storage. */ }
  }
  return getDeviceTimeZone()
}
export const $creationTimeZone = atom(initialCreationZone())
export function setCreationTimeZone (zone: string) {
  if (!isTimeZone(zone)) return
  try {
    sessionStorage.setItem('meetingDraft.timezone', zone)
  } catch { /* Optional draft persistence. */ }
  $creationTimeZone.set(zone)
}
export function clearCreationTimeZone () {
  try {
    sessionStorage.removeItem('meetingDraft.timezone')
  } catch { /* Optional draft persistence. */ }
  $creationTimeZone.set(getDeviceTimeZone())
}
