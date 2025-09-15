import z from 'zod'

export const matchAlbumSchema = z.object({
    id: z.cuid().describe('Unique identifier of the album'),
    name: z.string().describe('Name of the album given by the user'),
    description: z.string().describe('Album description').optional(),
    creator: z.string().describe('Name of the creator'),
    totalPhotosCount: z.int().describe('Total number of photos in the album'),
    coverImageUrl: z
        .url()
        .describe('Hosted URL of the cover image for the album')
        .optional(),
    previewPhotos: z
        .array(z.url())
        .describe('Random photos from the album for the preview')
        .optional(),
})

export type MatchAlbumDto = z.infer<typeof matchAlbumSchema>
