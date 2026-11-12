import type { Locale } from '../i18n/config'
import type { getTranslations } from '../i18n'
import type { get_meetings_$meetingCode_response } from '../services/meetings'
import { formatDate, formatTime } from './time'

export function meetingShareUrl (code: string, origin: string): URL {
  return new URL(`/meetings/${encodeURIComponent(code)}`, origin)
}

export function getCreatorShareLabels (locale: Locale, t: ReturnType<typeof getTranslations>, meetingTitle: string) {
  return {
    locale,
    invitation: t('meeting.result.kakaoShare.description'),
    confirmedTitle: t('meeting.result.share.confirmedTitle', { title: meetingTitle }),
    allDay: t('meeting.confirmDialog.allDay'),
    locationPending: t('meeting.result.kakaoShare.locationPending'),
  }
}

export type CreatorShareLabels = ReturnType<typeof getCreatorShareLabels>

export function getMeetingShareContent (
  data: get_meetings_$meetingCode_response['data'],
  labels: CreatorShareLabels | null,
  origin: string,
) {
  const { meeting, locationVote } = data
  const url = meetingShareUrl(meeting.code, origin).href
  // Older meetings have no recorded language. Keep the author's words and numeric schedule.
  const title = meeting.confirmedDate && labels ? labels.confirmedTitle : meeting.title
  const lines = [title]
  if (!meeting.confirmedDate || !labels) {
    const invitation = labels?.invitation ?? meeting.description
    if (invitation) lines.push(invitation)
  }
  if (meeting.confirmedDate) {
    const date = labels ? formatDate(meeting.confirmedDate, labels.locale) : meeting.confirmedDate
    lines.push(`📅 ${date}`)
    const time = meeting.confirmedTime && meeting.confirmedTime !== 'ALL_DAY'
      ? (labels ? formatTime(meeting.confirmedTime, labels.locale, labels.allDay) : meeting.confirmedTime)
      : null
    if (time) lines.push(`🕐 ${time} (${meeting.timezone})`)
    const location = locationVote?.confirmedLocation?.name ?? labels?.locationPending
    if (locationVote?.enabled && location) lines.push(`📍 ${location}`)
  }
  // Keep preview metadata for every meeting; only confirmed plans include a message.
  return { title, text: meeting.confirmedDate ? lines.join('\n') : '', url, description: lines.slice(1).join(' · ') || title }
}

export function getShareCopyText (content: { text: string, url: string }): string {
  return content.text ? `${content.text}\n${content.url}` : content.url
}

type ShareNavigator = {
  share?: (data: ShareData) => Promise<void>
  clipboard?: Pick<Clipboard, 'writeText'>
}

export async function shareOrCopy (
  content: { title: string, text: string, url: string },
  target: ShareNavigator,
): Promise<'shared' | 'cancelled' | 'copied' | 'manual'> {
  if (target.share) {
    try {
      await target.share(content.text
        ? { title: content.title, text: content.text, url: content.url }
        : { url: content.url })
      return 'shared'
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    if (!target.clipboard) return 'manual'
    await target.clipboard.writeText(getShareCopyText(content))
    return 'copied'
  } catch {
    return 'manual'
  }
}
