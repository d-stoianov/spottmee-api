import z from 'zod'

const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export const imageFileSchema = z
    .custom<Express.Multer.File>()
    .refine(
        (file) => !file || ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype),
        {
            message: 'Invalid file type',
        },
    )
    .refine((file) => !file || file.size <= MAX_IMAGE_SIZE, {
        message: 'File is too large',
    })
