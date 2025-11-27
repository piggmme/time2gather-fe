import api from "../utils/api";
import type { success_response } from "./type";

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
  title: string;
  description?: string;
  timezone: string
  availableDates: {
    [date: string]: string[]
  }
}
export type post_meetings_response = success_response<{
  id: number
  meetingCode: string
  url: string
}>
const post_meetings = async (body: post_meetings_body) => {
  const response = await api.post<post_meetings_response>('/v1/meetings', body);
  return response.data;
};

type User = {
  userId: number,
  username: string,
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
  }
  participants: User[],
  schedule: {
    [date: string]: {
      [time: string]: User[]
    }
  }
  summary: {
    totalParticipants: number,
    bestSlots: {
      date: string,
      time: string,
      count: number,
      percentage: number
    }[]
  }
}>
const get_meetings_$meetingCode = async (meetingCode: string) => {
  const response = await api.get<get_meetings_$meetingCode_response>(`/v1/meetings/${meetingCode}`);
  return response.data;
};


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
  const response = await api.get<get_meetings_$meetingCode_selections_response>(`/v1/meetings/${meetingCode}/selections`);
  return response.data;
}

export type put_meetings_$meetingCode_selections_body = {
  selections: {
    [date: string]: string[]
  }
}
const put_meetings_$meetingCode_selections = async (meetingCode: string, body: put_meetings_$meetingCode_selections_body) => {
  const response = await api.put<success_response<null>>(`/v1/meetings/${meetingCode}/selections`, body);
  return response.data;
}

export const meetings = {
  post: post_meetings,
  $meetingCode: {
    get: get_meetings_$meetingCode,
    selections: {
      get: get_meetings_$meetingCode_selections,
      put: put_meetings_$meetingCode_selections,
    },
  }
}