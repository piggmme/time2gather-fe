import api from '../utils/api'
import type { success_response } from './type'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ChatRequest = {
  sessionId: string | null
  message: string
}

type ChatResponseData = {
  sessionId: string
  message: string
}

type PostChatResponse = success_response<ChatResponseData>

const postChat = async (request: ChatRequest): Promise<ChatResponseData> => {
  const response = await api.post<PostChatResponse>('v1/chat', request)
  return response.data.data
}

export const chat = {
  post: postChat,
}
