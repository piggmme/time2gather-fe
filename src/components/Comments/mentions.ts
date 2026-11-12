import type { Mention } from '../../services/comments'
// UTF-16 offsets match textarea selection offsets and Java String indices.
// Editing any part of a selected mention turns it into ordinary text.
export function moveMentions (before: string, after: string, mentions: Mention[]): Mention[] {
  let start = 0
  while (start < before.length && start < after.length && before[start] === after[start])
    start++
  let suffix = 0
  while (suffix < before.length - start && suffix < after.length - start && before[before.length - suffix - 1] === after[after.length - suffix - 1])
    suffix++
  const end = before.length - suffix
  const delta = after.length - before.length
  return mentions.flatMap((m) => {
    if (m.end <= start)
      return [m]
    if (m.start >= end)
      return [{ ...m, start: m.start + delta, end: m.end + delta }]
    return []
  })
}
export function mentionQuery (body: string, caret: number) {
  const match = /(?:^|\s)@([^@\n]{0,100})$/u.exec(body.slice(0, caret))
  return match ? { start: caret - match[1].length - 1, end: caret, query: match[1] } : null
}
