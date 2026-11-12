import { convertWallTime } from './timezone'

type Selections = Record<string, string[]>
type Slot = { date: string, time: string }

// The display grid may cross midnight. Keep an explicit mapping so selection
// edits always write the original meeting date/time, including fractional offsets.
export function projectVotingTimeZone (availableDates: Selections, sourceZone: string, targetZone: string) {
  const sourceByDisplay: Record<string, Record<string, Slot>> = {}
  const displayBySource: Record<string, Record<string, Slot>> = {}
  const availableTimes = new Set<string>()
  for (const [date, times] of Object.entries(availableDates)) {
    for (const time of times) {
      const local = convertWallTime(date, time, sourceZone, targetZone)
      if (!local) return undefined
      const day = sourceByDisplay[local.date] ??= {}
      if (day[local.time]) return undefined
      day[local.time] = { date, time }
      ;(displayBySource[date] ??= {})[time] = local
      availableTimes.add(local.time)
    }
  }
  function toDisplay (selections: Selections): Selections {
    const result: Selections = {}
    for (const [date, times] of Object.entries(selections)) {
      for (const time of times) {
        const local = displayBySource[date]?.[time]
        if (local) (result[local.date] ??= []).push(local.time)
      }
    }
    return result
  }
  function toSource (selections: Selections): Selections {
    const result: Selections = {}
    for (const [date, times] of Object.entries(selections)) {
      for (const time of times) {
        const source = sourceByDisplay[date]?.[time]
        if (source) (result[source.date] ??= []).push(source.time)
      }
    }
    return result
  }
  return {
    sourceByDisplay, displayBySource, dates: Object.keys(sourceByDisplay).sort(), availableTimes: [...availableTimes].sort(), toDisplay, toSource,
  }
}
