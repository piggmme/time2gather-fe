import api from '../utils/api'
import type { success_response } from './type'
export type Person = {
  id: string
  name: string
  avatar: string | null
  host: boolean
}
export type Mention = {
  userId: string
  start: number
  end: number
}
export const commentReactions = [
  { emoji: '👍', label: 'like' },
  { emoji: '❤️', label: 'love' },
  { emoji: '😂', label: 'laugh' },
  { emoji: '🎉', label: 'celebrate' },
  { emoji: '🙏', label: 'thanks' },
  { emoji: '🤔', label: 'think' },
  { emoji: '👀', label: 'eyes' },
  { emoji: '💯', label: 'hundred' },
] as const
export type ReactionEmoji = typeof commentReactions[number]['emoji']
export type Reaction = {
  emoji: ReactionEmoji
  count: number
  reacted: boolean
  people: Person[]
}
export type Comment = {
  id: string
  author: Person
  rootId: string | null
  replyToId: string | null
  replyTo: Person | null
  body: string
  mentions: Mention[]
  createdAt: number
  edited: boolean
  status: 'ACTIVE' | 'DELETED' | 'HIDDEN'
  replyCount: number
  canEdit: boolean
  canDelete: boolean
  canHide: boolean
  reactions?: Reaction[]
}
export type CommentPage = {
  items: Comment[]
  nextCursor: string | null
}
export type Summary = {
  namesVersion?: number
  version: number
  count: number
  viewerId: string | null
  writable: boolean
}
export type Activity = {
  id: string
  rootId: string | null
  mentioned: boolean
}
export type CommentWrite = {
  body: string
  mentions: Mention[]
  replyToId?: string
  requestId: string
}
const path = (code: string) => `/v1/meetings/${encodeURIComponent(code)}/comments`
const get = async <T>(url: string, params?: Record<string, string | number | undefined>) => (await api.get<success_response<T>>(url, { params, suppressErrorToast: true })).data.data
export const comments = {
  list: (code: string, rootId?: string, cursor?: string) => get<CommentPage>(path(code), { rootId, cursor }),
  summary: (code: string) => get<Summary>(`${path(code)}/summary`),
  activity: (code: string, after: number) => get<Activity[]>(`${path(code)}/activity`, { after }),
  people: (code: string) => get<Person[]>(`${path(code)}/people`),
  one: (code: string, id: string) => get<Comment>(`${path(code)}/${id}`),
  react: async (code: string, id: string, emoji: ReactionEmoji, active: boolean) =>
    (await api.put<success_response<Comment>>(`${path(code)}/${id}/reactions`, { emoji, active }, { suppressErrorToast: true })).data.data,
  save: async (code: string, body: CommentWrite, id?: string) => {
    const response = id
      ? await api.put<success_response<Comment>>(`${path(code)}/${id}`, body, { suppressErrorToast: true })
      : await api.post<success_response<Comment>>(path(code), body, { suppressErrorToast: true })
    return response.data.data
  },
  remove: async (code: string, id: string, hide: boolean) => {
    if (hide)
      await api.post(`${path(code)}/${id}/hide`, {}, { suppressErrorToast: true })
    else
      await api.delete(`${path(code)}/${id}`, { suppressErrorToast: true })
  },
}
