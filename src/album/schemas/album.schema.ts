import z from 'zod'

export const albumSchema = z.object({
    id: z.cuid(),
    name: z.string(),
    createdAt: z.date(),
    description: z.string().optional(),
})

export type AlbumDto = z.infer<typeof albumSchema>
