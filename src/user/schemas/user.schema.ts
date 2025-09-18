import { User } from '@prisma/client'
import z from 'zod'

export const userSchema = z.object({
    id: z.cuid().describe('Unique identifier of the user'),
    uid: z.string().describe('Unique identifier of the user (firebase)'),
    picture: z.string().describe('Picture of the user').optional(),
    email: z.email().describe('Email of the user'),
    name: z.string().describe('Name user created'),
    createdAt: z.date().describe('Date when user signed up'),
})

export const serializeUser = (user: User): UserDto => {
    return userSchema.parse({
        id: user.id,
        uid: user.uid,
        picture: user.picture,
        email: user.email,
        name: user.name ?? null,
        createdAt: user.created_at,
    })
}

export type UserDto = z.infer<typeof userSchema>
