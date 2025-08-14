import { createAlbumSchema } from './create-album.schema'
import { z } from 'zod'

export const updateAlbumSchema = createAlbumSchema.partial()

export type UpdateAlbumDto = z.infer<typeof updateAlbumSchema>
