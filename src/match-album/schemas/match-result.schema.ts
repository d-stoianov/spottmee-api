import z from 'zod'
import { photoSchema } from '@/photo/schemas/photo.schema'

export const matchResultSchema = z.object({
    id: z.cuid().describe('Unique identifier of the match result'),
    status: z.enum(['PROCESSING', 'READY']).describe('Status of match result'),
    matches: z.array(photoSchema).describe('Photos matched'),
})

export type MatchResultDto = z.infer<typeof matchResultSchema>
