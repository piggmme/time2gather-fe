import type { get_meetings_$meetingCode_response } from '../services/meetings'

type MeetingData = get_meetings_$meetingCode_response['data']

// Work on displayed date/time keys, after time zone projection. Never change votes.
export function getCalendarAvailability (
  schedule: MeetingData['schedule'],
  availableDates: MeetingData['meeting']['availableDates'],
  selectedIds: ReadonlySet<number>,
  selectionType: MeetingData['meeting']['selectionType'] = 'TIME',
): MeetingData['schedule'] {
  const result: MeetingData['schedule'] = {}
  if (selectedIds.size === 0) return result

  for (const [date, times] of Object.entries(availableDates)) {
    // Date-only candidates arrive as [], but their saved attendance uses ALL_DAY.
    const slotKeys = selectionType === 'ALL_DAY' ? ['ALL_DAY'] : times
    for (const time of slotKeys) {
      const slot = schedule[date]?.[time]
      if (!slot) continue
      const attendees = new Map(slot.participants
        .filter(person => selectedIds.has(person.userId))
        .map(person => [person.userId, person]))
      if (attendees.size === 0) continue
      const day = result[date] ??= {}
      day[time] = { count: attendees.size, participants: [...attendees.values()] }
    }
  }
  return result
}
