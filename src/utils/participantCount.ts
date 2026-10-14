type Participant = {
  userId: number
}

export function getProspectiveParticipantCount (
  participants: Participant[],
  currentUserId?: number,
  reportedTotal = participants.length,
) {
  const savedParticipantCount = Math.max(participants.length, reportedTotal)
  const isNewParticipant = currentUserId !== undefined
    && !participants.some(participant => participant.userId === currentUserId)

  return savedParticipantCount + (isNewParticipant ? 1 : 0)
}
