type Participant = {
  userId: number
}

export function getOtherParticipantCount (
  participants: Participant[],
  currentUserId?: number,
  reportedTotal = participants.length,
) {
  const savedParticipantCount = Math.max(participants.length, reportedTotal)
  const includesCurrentUser = currentUserId !== undefined
    && participants.some(participant => participant.userId === currentUserId)

  return Math.max(0, savedParticipantCount - (includesCurrentUser ? 1 : 0))
}
