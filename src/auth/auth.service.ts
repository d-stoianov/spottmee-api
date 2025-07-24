import { BadRequestException, Injectable } from '@nestjs/common'

import { FirebaseService } from '@/firebase/firebase.service'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateUserDto } from '@/auth/dto/create-user.dto'

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebaseService: FirebaseService,
    ) {}

    async createUser(dto: CreateUserDto) {
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

        return { user, customToken }
    }
}
