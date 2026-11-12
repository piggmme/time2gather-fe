import type { get_meetings_$meetingCode_response } from '../services/meetings'
import { projectVotingTimeZone } from './votingTimeZone'

type MeetingData = get_meetings_$meetingCode_response['data']
export type ConfirmationSlot = Pick<MeetingData['summary']['bestSlots'][number],
  'date' | 'time' | 'startSlotIndex' | 'endSlotIndex' | 'count' | 'percentage'>

export type DisplayedConfirmationSlot = ConfirmationSlot & { displayDate: string, displayTime: string }
export type ConfirmationDateGroup = { date: string, maxCount: number, slots: DisplayedConfirmationSlot[] }

// Offer one exact start time per displayed date, without hiding other candidates.
export function recommendConfirmationSlots (groups: ConfirmationDateGroup[]): DisplayedConfirmationSlot[] {
  return groups.flatMap((group) => {
    const best = group.slots.reduce<DisplayedConfirmationSlot | undefined>((best, slot) =>
      !best || slot.count > best.count || (slot.count === best.count && slot.displayTime < best.displayTime) ? slot : best, undefined)
    return best && best.count > 0 ? [best] : []
  }).sort((a, b) => b.count - a.count || a.displayDate.localeCompare(b.displayDate) || a.displayTime.localeCompare(b.displayTime)).slice(0, 3)
}

// Group by the date the host sees, while keeping the original keys for writes.
// Ambiguous DST conversions fall back to the meeting zone for the whole picker.
export function groupConfirmationSlots (choices: ConfirmationSlot[], sourceZone: string, targetZone: string) {
  const availableDates: Record<string, string[]> = {}
  for (const slot of choices) {
    if (slot.time !== 'ALL_DAY') (availableDates[slot.date] ??= []).push(slot.time)
  }
  const projection = projectVotingTimeZone(availableDates, sourceZone, targetZone)
  const groups = new Map<string, DisplayedConfirmationSlot[]>()
  for (const slot of choices) {
    const display = projection?.displayBySource[slot.date]?.[slot.time] ?? slot
    const slots = groups.get(display.date) ?? []
    slots.push({ ...slot, displayDate: display.date, displayTime: display.time })
    groups.set(display.date, slots)
  }
  return {
    timezone: projection ? targetZone : sourceZone,
    groups: [...groups].map(([date, slots]) => ({
      date,
      // Count people who can meet at the same time, not votes summed across times.
      maxCount: Math.max(...slots.map(slot => slot.count)),
      slots: slots.sort((a, b) => a.displayTime.localeCompare(b.displayTime)),
    })).sort((a, b) => b.maxCount - a.maxCount || a.date.localeCompare(b.date)),
  }
}

// The summary contains only winning ranges. Confirmation must use every option
// registered by the host and retain its source-zone date and slot index.
export function buildConfirmationSlots (
  availableDates: MeetingData['meeting']['availableDates'],
  schedule: MeetingData['schedule'],
  totalParticipants: number,
  selectionType: 'ALL_DAY' | 'TIME',
  intervalMinutes = 60,
): ConfirmationSlot[] {
  const choices: ConfirmationSlot[] = []
  for (const [date, times] of Object.entries(availableDates)) {
    for (const time of selectionType === 'ALL_DAY' ? ['ALL_DAY'] : new Set(times)) {
      let index = -1
      if (selectionType === 'TIME') {
        const match = /^(\d{2}):(\d{2})$/.exec(time)
        if (!match || intervalMinutes <= 0) continue
        const hour = Number(match[1])
        const minute = Number(match[2])
        index = (hour * 60 + minute) / intervalMinutes
        if (hour > 23 || minute > 59 || !Number.isInteger(index)) continue
      }
      const count = schedule[date]?.[time]?.count ?? 0
      choices.push({
        date, time, startSlotIndex: index, endSlotIndex: index, count,
        percentage: totalParticipants > 0 ? `${Math.round(count / totalParticipants * 100)}%` : '0%',
      })
    }
  }
  return choices.sort((a, b) => b.count - a.count || a.date.localeCompare(b.date) || a.startSlotIndex - b.startSlotIndex)
}
