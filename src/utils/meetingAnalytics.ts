import type { get_meetings_$meetingCode_response } from '../services/meetings'
import { hasUserScheduleSelection } from './meetingSelection'
import { trackAnalyticsEvent } from './analytics'

export function trackMeetingResponseSaved (
  data: get_meetings_$meetingCode_response['data'],
  userId: number | undefined,
  unavailable: boolean,
  savedInThisForm: boolean,
) {
  const previousResponse = savedInThisForm || hasUserScheduleSelection(data.schedule, userId)
    || !!data.participants.find(person => person.userId === userId)?.availabilityResponse
  trackAnalyticsEvent('meeting_response_saved', {
    selection_type: data.meeting.selectionType,
    actor_role: data.meeting.host.id === userId ? 'host' : 'participant',
    response_action: previousResponse ? 'update' : 'first',
    response_type: unavailable ? 'unavailable' : 'available',
    location_vote_enabled: !!data.locationVote?.enabled,
  })
}
