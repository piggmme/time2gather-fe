import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const base = './src/content/blog'

const blog = defineCollection({
  loader: glob({
    pattern: '*/*.md',
    base,
    generateId: ({ entry }) => entry.slice(0, -'.md'.length),
  }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
  }),
})

const blogPublications = defineCollection({
  loader: glob({
    pattern: '*/publication.json',
    base,
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({
    draft: z.boolean().default(true),
    publishedOn: z.string().date().optional(),
  }).refine(post => post.draft || post.publishedOn, {
    message: 'Set publishedOn to the publication date before publishing.',
    path: ['publishedOn'],
  }),
})

export const collections = { blog, blogPublications }
