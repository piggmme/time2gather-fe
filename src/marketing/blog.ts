import { getCollection } from 'astro:content'

export const blogLocale = 'ko' as const
export const blogPath = `/${blogLocale}/blog/`
export const blogCopy = {
  title: '블로그',
  description: '친구 모임, 회식, 스터디에서 모두가 가능한 시간과 장소를 정하는 방법을 소개합니다.',
  backToList: '글 목록으로',
  createPoll: '일정 투표 만들기',
}

const publicationDate = new Intl.DateTimeFormat(blogLocale, { dateStyle: 'long', timeZone: 'UTC' })

export function formatPublicationDate (date: string): string {
  return publicationDate.format(new Date(date))
}

export function blogPostPath (id: string): string {
  return `${blogPath}${id}/`
}

export async function getBlogPosts () {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft)
  return posts.sort((first, second) => (second.data.publishedOn ?? '').localeCompare(first.data.publishedOn ?? '')
    || first.id.localeCompare(second.id))
}
