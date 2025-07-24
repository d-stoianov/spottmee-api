import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthContextType } from '@/auth/auth.guard'

export const AuthContext = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthContextType => {
        const request = ctx.switchToHttp().getRequest()
        return request.authContext
    },
)
