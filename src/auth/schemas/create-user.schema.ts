import { z } from 'zod'

export const createUserSchema = z.object({
    name: z
        .string()
        .min(2, { error: 'Name is too short' })
        .max(32, { error: 'Name is too long' }),
    email: z.email({ error: 'Incorrect email format' }),
    password: z
        .string({ error: 'Password should be a string type' })
        .min(6, { error: 'Password is too short' }),
})

export type CreateUserDto = z.infer<typeof createUserSchema>
