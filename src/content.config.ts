import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    draft: z.boolean().default(true),
    publishedOn: z.string().date().optional(),
  }).refine(post => post.draft || post.publishedOn, {
    message: 'Set publishedOn to the publication date before publishing.',
    path: ['publishedOn'],
  }),
})

export const collections = { blog }
