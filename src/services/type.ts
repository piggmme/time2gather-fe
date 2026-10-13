export type error_response = {
  success: false
  data: null
  message: string
  messageKey?: string
}

export type success_response<T> = {
  success: true
  data: T
  message: null
}
