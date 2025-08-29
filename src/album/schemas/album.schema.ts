import { Album } from '@prisma/client'
import z from 'zod'

export const albumSchema = z.object({
    id: z.cuid().describe('Unique identifier of the album'),
    name: z.string().describe('Name of the album given by the user'),
    createdAt: z.date().describe('Date when album was created'),
    description: z.string().describe('Album description').optional(),
    coverImageUrl: z
        .url()
        .describe('Hosted URL of the cover image for the album')
        .optional(),
})

export const serializeAlbum = (album: Album): AlbumDto => {
    return albumSchema.parse({
        id: album.id,
        name: album.name,
        createdAt: album.createdAt,
        description: album.description ?? undefined,
        coverImageUrl: album.cover_image_url ?? undefined,
    })
}

export type AlbumDto = z.infer<typeof albumSchema>
