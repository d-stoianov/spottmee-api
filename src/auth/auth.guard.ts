import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { User } from '@prisma/client'
import { DecodedIdToken } from 'firebase-admin/auth'
import { FirebaseService } from 'src/firebase/firebase.service'
import { PrismaService } from 'src/prisma/prisma.service'

export interface AuthContextType {
    user: User
    decodedIdToken: DecodedIdToken
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const authHeader = request.headers.authorization

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing token')
        }

        const token = authHeader.split(' ')[1]

        try {
            const decodedIdToken = await this.firebase
                .getAuth()
                .verifyIdToken(token)
            const user = await this.prisma.user.findUnique({
                where: { uid: decodedIdToken.uid },
            })

            if (!user) {
                throw new UnauthorizedException(
                    'Cannot find user by firebase UID',
                )
            }

            request.authContext = {
                user,
                decodedIdToken,
            } as AuthContextType

            return true
        } catch (error: any) {
            // firebase errors
            if (error?.code === 'auth/id-token-expired') {
                throw new UnauthorizedException('Token expired')
            }

            if (error?.code === 'auth/argument-error') {
                throw new UnauthorizedException('Invalid token')
            }

            throw new UnauthorizedException('Not authorized')
        }
    }
}
