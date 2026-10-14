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
