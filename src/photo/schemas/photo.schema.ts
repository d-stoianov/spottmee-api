import { Photo } from '@prisma/client'
import z from 'zod'

export const photoSchema = z.object({
    id: z.string().describe('Unique identifier of the photo'),
    albumId: z.string().describe('ID of the album this photo belongs to'),
    originalName: z.string().describe('Original filename of the photo'),
    url: z
        .string()
        .describe('Hosted URL of the photo')
        .nullable()
        .default(null),
    size: z.number().int().describe('Size of the photo in bytes'),
    type: z.string().describe('MIME type of the photo, e.g., image/jpeg'),
    createdAt: z.date().describe('Timestamp when the photo was created'),
    status: z
        .enum(['UPLOADED', 'PROCESSING', 'READY', 'FAILED'])
        .describe('Current status of the photo'),
})

export const serializePhoto = (photo: Photo): PhotoDto => {
    return photoSchema.parse({
        id: photo.id,
        albumId: photo.album_id,
        originalName: photo.original_name,
        url: photo.url,
        size: photo.size,
        type: photo.type,
        createdAt: photo.created_at,
        status: photo.status,
    })
}

export type PhotoDto = z.infer<typeof photoSchema>
