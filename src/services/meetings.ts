import api from '../utils/api'
import type { success_response } from './type'

/**
 * @description Create a new meeting
 * @example
 * {
 *   title: "프로젝트 킥오프 미팅",
 *   description: "2월 신규 프로젝트 시작 회의",
 *   timezone: "Asia/Seoul",
 *   availableDates: {
 *     "2024-02-15": ["09:00", "09:30", "10:00", "10:30"],
 *     "2024-02-16": ["11:00", "11:30", "12:00"]
 *   }
 * }
 */
export type post_meetings_body = {
  title: string
  description?: string
  timezone: string
  availableDates: {
    [date: string]: string[] | null
  }
  selectionType: 'ALL_DAY' | 'TIME'
  locationVoteEnabled?: boolean
  locations?: string[]
}
export type post_meetings_response = success_response<{
  id: number
  meetingCode: string
  url: string
}>
const post_meetings = async (body: post_meetings_body) => {
  const response = await api.post<post_meetings_response>('/v1/meetings', body)
  return response.data
}

type User = {
  userId: number
  username: string
  profileImageUrl: string
}
/**
 * @description Get a meeting by meeting code
 * @example
{
  "success": true,
  "data": {
    "meeting": {
      "id": 1,
      "code": "mtg_a3f8k2md9x",
      "title": "프로젝트 킥오프 미팅",
      "description": "2월 신규 프로젝트 시작 회의",
      "host": {
        "id": 1,
        "username": "jinwoo",
        "profileImageUrl": "https://..."
      },
      "timezone": "Asia/Seoul",
      "availableDates": {
        "2024-02-15": [
          "09:00",
          "09:30",
          "10:00"
        ],
        "2024-02-16": [
          "11:00",
          "11:30"
        ]
      }
    },
    "participants": [
      {
        "userId": 1,
        "username": "jinwoo",
        "profileImageUrl": "https://..."
      }
    ],
    "schedule": {
      "2024-02-15": {
        "09:00": [
          {
            "userId": 1,
            "username": "jinwoo",
            "profileImageUrl": "https://..."
          },
          {
            "userId": 2,
            "username": "철수",
            "profileImageUrl": null
          }
        ],
        "09:30": [
          {
            "userId": 1,
            "username": "jinwoo",
            "profileImageUrl": "https://..."
          }
        ]
      }
    },
    "summary": {
      "totalParticipants": 5,
      "bestSlots": [
        {
          "date": "2024-02-15",
          "time": "09:00",
          "count": 4,
          "percentage": 80
        }
      ]
    }
  },
  "message": null
}
 */
export type get_meetings_$meetingCode_response = success_response<{
  meeting: {
    id: number
    code: string
    title: string
    description?: string
    host: {
      id: number
      username: string
      profileImageUrl: string
    }
    timezone: string
    availableDates: {
      [date: string]: string[]
    }
    selectionType: 'ALL_DAY' | 'TIME'
    confirmedDate?: string | null
    confirmedTime?: string | null
  }
  participants: User[]
  schedule: {
    [date: string]: {
      [time: string | 'ALL_DAY']: {
        count: number
        participants: User[]
      }
    }
  }
  summary: {
    totalParticipants: number
    bestSlots: {
      date: string
      time: string
      count: number
      percentage: string
    }[]
  }
}>
const get_meetings_$meetingCode = async (meetingCode: string) => {
  const response = await api.get<get_meetings_$meetingCode_response>(`/v1/meetings/${meetingCode}`)
  return response.data
}

/**
 * @description Get selections for a meeting
 * @example
 * {
 *  "success": true,
 *  "data": {
 *    "selections": {
 *      "2024-02-15": ["09:00", "09:30", "10:30"],
 *      "2024-02-16": ["11:00", "11:30"]
 *    }
 *  },
 *  "message": null
 * }
 */
export type get_meetings_$meetingCode_selections_response = success_response<{
  selections: {
    [date: string]: string[]
  }
}>
const get_meetings_$meetingCode_selections = async (meetingCode: string) => {
  const response = await api.get<get_meetings_$meetingCode_selections_response>(`/v1/meetings/${meetingCode}/selections`)
  return response.data
}

export type put_meetings_$meetingCode_selections_body = {
  selections: {
    date: string
    type: 'ALL_DAY' | 'TIME'
    times: string[]
  }[]
}
const put_meetings_$meetingCode_selections = async (meetingCode: string, body: put_meetings_$meetingCode_selections_body) => {
  const response = await api.put<success_response<null>>(`/v1/meetings/${meetingCode}/selections`, body)
  return response.data
}

export type get_meetings_$meetingCode_report_response = success_response<{
  reportId: number
  meetingId: number
  summaryText: string
}>
const get_meetings_$meetingCode_report = async (meetingCode: string) => {
  const response = await api.get<get_meetings_$meetingCode_report_response>(`/v1/meetings/${meetingCode}/report`)
  return response.data
}

const post_meetings_$meetingCode_auth_anonymous = async (meetingCode: string, body: post_meetings_$meetingCode_auth_anonymous_body) => {
  const response = await api.post<success_response<null>>(`/v1/meetings/${meetingCode}/auth/anonymous`, body)
  return response.data
}
export type post_meetings_$meetingCode_auth_anonymous_body = {
  username: string
  password: string
}

/**
 * @description Confirm a meeting with selected date and slot
 * @param meetingCode Meeting code
 * @param date Date in yyyy-MM-dd format
 * @param slotIndex Slot index (null for ALL_DAY)
 */
export type put_meetings_$meetingCode_confirm_body = {
  date: string
  slotIndex: number | null
}
const put_meetings_$meetingCode_confirm = async (meetingCode: string, body: put_meetings_$meetingCode_confirm_body) => {
  const response = await api.put<success_response<null>>(`/v1/meetings/${meetingCode}/confirm`, body)
  return response.data
}

/**
 * @description Cancel meeting confirmation
 * @param meetingCode Meeting code
 */
const delete_meetings_$meetingCode_confirm = async (meetingCode: string) => {
  const response = await api.delete<success_response<null>>(`/v1/meetings/${meetingCode}/confirm`)
  return response.data
}

/**
 * @description Generate export URL for calendar ICS file
 * @param meetingCode Meeting code
 * @param date Optional date in yyyy-MM-dd format
 * @param slotIndex Optional slot index (-1 for ALL_DAY)
 * @returns Full URL for ICS file download
 */
const getExportUrl = (meetingCode: string, date?: string, slotIndex?: number): string => {
  const baseUrl = 'https://api.time2gather.org/api/v1/meetings'
  const url = new URL(`${baseUrl}/${meetingCode}/export`)

  if (date !== undefined && slotIndex !== undefined) {
    url.searchParams.append('date', date)
    url.searchParams.append('slotIndex', String(slotIndex))
  }

  return url.toString()
}

/**
 * @description Convert time string (HH:mm) to slot index
 * @param time Time string in HH:mm format (e.g., "09:00")
 * @param intervalMinutes Interval in minutes (default: 60)
 * @returns Slot index
 */
const timeToSlotIndex = (time: string, intervalMinutes: number = 60): number => {
  if (time === 'ALL_DAY') {
    return -1
  }
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  return Math.floor(totalMinutes / intervalMinutes)
}

export const meetings = {
  post: post_meetings,
  getExportUrl,
  timeToSlotIndex,
  $meetingCode: {
    get: get_meetings_$meetingCode,
    selections: {
      get: get_meetings_$meetingCode_selections,
      put: put_meetings_$meetingCode_selections,
    },
    report: {
      get: get_meetings_$meetingCode_report,
    },
    auth: {
      anonymous: {
        post: post_meetings_$meetingCode_auth_anonymous,
      },
    },
    confirm: {
      put: put_meetings_$meetingCode_confirm,
      delete: delete_meetings_$meetingCode_confirm,
    },
  },
}
