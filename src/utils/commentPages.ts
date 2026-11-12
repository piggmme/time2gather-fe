import type { Comment, CommentPage } from '../services/comments'

/** Refresh already-loaded pages without collapsing expanded threads or an editor. */
export async function reloadVisibleComments (
  load: (cursor?: string) => Promise<CommentPage>,
  count: number,
  pinned: string[],
  one: (id: string) => Promise<Comment>,
): Promise<CommentPage> {
  const items = new Map<string, Comment>()
  const cursors = new Set<string>()
  let nextCursor: string | null = null
  do {
    const page = await load(nextCursor ?? undefined)
    for (const item of page.items) items.set(item.id, item)
    nextCursor = page.nextCursor
    if (nextCursor) {
      if (cursors.has(nextCursor)) throw new Error('Repeated comment cursor')
      cursors.add(nextCursor)
    }
  } while (nextCursor && items.size < Math.max(count, 1))
  for (const id of new Set(pinned)) {
    if (!items.has(id)) items.set(id, await one(id))
  }
  return { items: [...items.values()], nextCursor }
}
