import dayjs from 'dayjs'
import type { get_meetings_$meetingCode_response } from '../services/meetings'
import { convertWallTime } from './timezone'

type MeetingData = get_meetings_$meetingCode_response['data']

// Only the read-only result is projected. Voting and server writes keep source keys.
export function projectResultTimeZone (data: MeetingData, targetZone: string) {
  const sourceZone = data.meeting.timezone
  const availableDates: Record<string, string[]> = {}
  const schedule: MeetingData['schedule'] = {}
  const bestSlots: Array<MeetingData['summary']['bestSlots'][number] & { endDate: string }> = []
  for (const [date, times] of Object.entries(data.meeting.availableDates)) {
    for (const time of times) {
      const local = convertWallTime(date, time, sourceZone, targetZone)
      if (!local) return undefined
      const values = availableDates[local.date] ??= []
      if (!values.includes(local.time)) values.push(local.time)
    }
  }
  for (const [date, slots] of Object.entries(data.schedule)) {
    for (const [time, slot] of Object.entries(slots)) {
      const local = convertWallTime(date, time, sourceZone, targetZone)
      if (!local) return undefined
      const day = schedule[local.date] ??= {}
      // A repeated DST hour cannot be represented by one grid cell safely.
      if (day[local.time]) return undefined
      day[local.time] = slot
    }
  }
  for (const slot of data.summary.bestSlots) {
    const [startTime, endTime = startTime] = slot.time.split(/\s*(?:~|–)\s*/)
    const endDate = endTime < startTime ? dayjs(slot.date).add(1, 'day').format('YYYY-MM-DD') : slot.date
    const start = convertWallTime(slot.date, startTime, sourceZone, targetZone)
    const end = convertWallTime(endDate, endTime, sourceZone, targetZone)
    if (!start || !end) return undefined
    bestSlots.push({ ...slot, date: start.date, endDate: end.date, time: start.time === end.time && start.date === end.date ? start.time : `${start.time} ~ ${end.time}` })
  }
  for (const times of Object.values(availableDates)) times.sort()
  return { availableDates, schedule, bestSlots }
}
