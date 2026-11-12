import type { get_meetings_$meetingCode_response } from '../services/meetings'

type MeetingSchedule = get_meetings_$meetingCode_response['data']['schedule']

export function hasUserScheduleSelection (schedule: MeetingSchedule, userId?: number) {
  if (userId === undefined) return false

  return Object.values(schedule).some(timeSlots => (
    Object.values(timeSlots).some(slot => (
      slot.participants.some(participant => participant.userId === userId)
    ))
  ))
}

export function getConfirmedAvailabilityTime (meeting: { selectionType: 'ALL_DAY' | 'TIME', confirmedSlotIndex?: number | null, intervalMinutes?: number, confirmedTime?: string | null }): string {
  if (meeting.selectionType === 'ALL_DAY') return 'ALL_DAY'
  const interval = meeting.intervalMinutes ?? 60
  if (meeting.confirmedSlotIndex !== null && meeting.confirmedSlotIndex !== undefined) {
    const minutes = meeting.confirmedSlotIndex * interval
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }
  return meeting.confirmedTime ?? 'ALL_DAY'
}
