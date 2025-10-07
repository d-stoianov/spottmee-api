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
    totalPhotosCount: z
        .number()
        .describe('Total Photos for the album')
        .optional(),
    matchesCount: z.number('Number of match runs made on the album'),
    size: z
        .number()
        .describe('Total size of photos in the album (bytes)')
        .optional(),
})

export type AlbumDto = z.infer<typeof albumSchema>
