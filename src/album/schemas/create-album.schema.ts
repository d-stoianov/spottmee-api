import { z } from 'zod'

export const createAlbumSchema = z.object({
    name: z
        .string({ error: 'Name should be a string type' })
        .min(2, { error: 'Name is too short' })
        .max(32, { error: 'Name is too long' }),
    description: z
        .string({ error: 'Description should be a string type' })
        .optional(),
})

export type CreateAlbumDto = z.infer<typeof createAlbumSchema>
