import type { get_meetings_$meetingCode_response } from '../services/meetings'
import { buildConfirmationSlots } from './confirmationSlots'
import { projectResultTimeZone } from './resultTimeZone'

type MeetingData = get_meetings_$meetingCode_response['data']

// Keep source keys for confirmation; projected labels are only for reading.
export function buildDecisionSummary (data: MeetingData, displayZone: string) {
  const exact = buildConfirmationSlots(data.meeting.availableDates, data.schedule, data.summary.totalParticipants,
    data.meeting.selectionType, data.meeting.intervalMinutes)
  const valid = new Set(exact.map(slot => `${slot.date}/${slot.time}`))
  const projection = data.meeting.selectionType === 'TIME' ? projectResultTimeZone(data, displayZone) : undefined
  const options = data.summary.bestSlots.flatMap((source, index) => {
    const start = source.time.split(/\s*(?:~|–)\s*/)[0]
    const key = `${source.date}/${start}`
    if (source.count <= 0 || !valid.has(key)) return []
    const shown = projection?.bestSlots[index] ?? source
    return [{
      key, sourceDate: source.date, sourceTime: start, date: shown.date, time: shown.time,
      endDate: 'endDate' in shown ? String(shown.endDate) : shown.date,
      count: source.count, participants: source.participants,
    }]
  }).sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  const maxCount = options[0]?.count ?? 0
  const total = data.summary.totalParticipants
  const pending = data.participants.filter(person => person.availabilityResponse === 'NEEDS_RESPONSE')
  const allUnavailable = data.participants.length > 0 && data.participants.every(person => person.availabilityResponse === 'NONE')
  const state = maxCount > 0
    ? maxCount === total ? 'all' : 'partial'
    : allUnavailable ? 'unavailable' : pending.length > 0 ? 'pending' : 'empty'
  // Equal-attendance alternatives stay in chronological order without an invented ranking.
  return {
    state, maxCount, total, pending, options: options.filter(option => option.count === maxCount),
  }
}
