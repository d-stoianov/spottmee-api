import { BadRequestException, Injectable } from '@nestjs/common'

import { FirebaseService } from '@/firebase/firebase.service'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from './schemas/create-user.schema'
import { serializeUser, UserDto } from '@/user/schemas/user.schema'

type UserWithToken = { user: UserDto; customToken: string }

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebaseService: FirebaseService,
    ) {}

    async createUser(dto: CreateUserDto): Promise<UserWithToken> {
        const { email, password, name } = dto

        const existing = await this.prisma.user.findFirst({
            where: { email: email },
        })

        if (existing) {
            throw new BadRequestException('Email already in use')
        }

        const firebaseUser = await this.firebaseService.getAuth().createUser({
            email,
            password,
            displayName: name,
        })
        const user = await this.prisma.user.create({
            data: { uid: firebaseUser.uid, email, name },
        })
        const customToken = await this.firebaseService
            .getAuth()
            .createCustomToken(firebaseUser.uid)

        return { user: serializeUser(user), customToken }
    }

    async createUserWithProvider(idToken: string): Promise<UserWithToken> {
        // verify firebase token
        const decoded = await this.firebaseService
            .getAuth()
            .verifyIdToken(idToken)

        const { uid, email, name, picture } = decoded

        if (!email) throw new BadRequestException('No email provided')

        let user = await this.prisma.user.findUnique({ where: { uid } })
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    uid,
                    email,
                    name: typeof name === 'string' ? name : undefined,
                    picture,
                },
            })
        }

        // optional: issue a custom token if you want client to re-auth
        const customToken = await this.firebaseService
            .getAuth()
            .createCustomToken(uid)

        return { user: serializeUser(user), customToken }
    }
}
