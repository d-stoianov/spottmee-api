import z from 'zod'
import { photoSchema } from '@/photo/schemas/photo.schema'

export const photosResponseDtoSchema = z.object({
    photos: z.array(photoSchema).describe('Photos array (current page)'),
    total: z.int().describe('Total number of photos (not paginated)'),
    readyCount: z
        .int()
        .describe('Total number of photos with status ready (not paginated)'),
})

export type PhotosResponseDto = z.infer<typeof photosResponseDtoSchema>
