import { getCollection, type CollectionEntry } from 'astro:content'
import { intlLocale } from '../i18n/config'
import { isMarketingLocale, marketingLocales, type MarketingLocale } from './config'

export function blogPath (locale: MarketingLocale, slug?: string): string {
  return slug ? `/${locale}/blog/${slug}/` : `/${locale}/blog/`
}

export type BlogLanguageLink = { locale: MarketingLocale, path: string }

export function blogLanguageLinks (locales: MarketingLocale[], slug?: string): BlogLanguageLink[] {
  return locales.map(locale => ({ locale, path: blogPath(locale, slug) }))
}

export function formatPublicationDate (locale: MarketingLocale, date: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date))
}

export async function getBlogTopics () {
  const publications = await getCollection('blogPublications')
  const topics = new Map(publications.map(({ id: slug, data }) => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid blog slug: ${slug}`)
    return [slug, { slug, ...data, posts: new Map<MarketingLocale, CollectionEntry<'blog'>>() }]
  }))
  const posts = await getCollection('blog')
  for (const post of posts) {
    const [slug, locale] = post.id.split('/')
    const topic = topics.get(slug)
    if (!topic) throw new Error(`Missing publication.json for blog topic: ${slug}`)
    if (!isMarketingLocale(locale)) throw new Error(`Unsupported blog locale in ${post.id}.md`)
    topic.posts.set(locale, post)
  }
  for (const topic of topics.values()) {
    if (topic.draft) continue
    const missing = marketingLocales.filter(locale => !topic.posts.has(locale))
    if (missing.length) throw new Error(`Cannot publish ${topic.slug}: missing translations for ${missing.join(', ')}`)
  }

  return [...topics.values()]
    .filter(topic => import.meta.env.DEV || !topic.draft)
    .sort((first, second) => (second.publishedOn ?? '').localeCompare(first.publishedOn ?? '')
      || first.slug.localeCompare(second.slug))
}
