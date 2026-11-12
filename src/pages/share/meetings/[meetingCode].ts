import type { APIRoute } from 'astro'
import { meetings, type get_meetings_$meetingCode_response } from '../../../services/meetings'
import { renderMeetingShareImage } from '../../../utils/meetingShareImage'

export const GET: APIRoute = async ({ params }) => {
  let meeting: get_meetings_$meetingCode_response['data']['meeting']
  try {
    const response = await meetings.$meetingCode.get(params.meetingCode!)
    meeting = response.data.meeting
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status
    return new Response(null, {
      status: status === 404 ? 404 : 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
  try {
    const png = await renderMeetingShareImage(meeting)
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
