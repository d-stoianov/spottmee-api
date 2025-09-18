import { z } from 'zod'
import { imageFileSchema } from '@/schemas/image.schema'

export const updateUserSchema = z
    .object({
        name: z
            .string()
            .min(2, { error: 'Name is too short' })
            .max(32, { error: 'Name is too long' }),
        picture: imageFileSchema,
    })
    .partial()

export type UpdateUserDto = z.infer<typeof updateUserSchema>
