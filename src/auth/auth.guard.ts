import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { User } from '@prisma/client'
import { DecodedIdToken } from 'firebase-admin/auth'
import { FirebaseService } from 'src/firebase/firebase.service'
import { UserService } from 'src/user/user.service'

export interface AuthContextType {
    user: User
    decodedIdToken: DecodedIdToken
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const authHeader = request.headers.authorization

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing token')
        }

        const token = authHeader.split(' ')[1]

        const decodedIdToken = await this.firebaseService
            .getAuth()
            .verifyIdToken(token)
        const user = await this.userService.getUserByUID(decodedIdToken.uid)

        if (!user) {
            throw new UnauthorizedException('Cannot find user by firebase UID')
        }

        request.authContext = {
            user,
            decodedIdToken,
        } as AuthContextType

        return true
    }
}
