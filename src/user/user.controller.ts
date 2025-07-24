import { Controller, Delete, Get, UseGuards } from '@nestjs/common'

import { UserService } from '@/user/user.service'
import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthContextType, AuthGuard } from '@/auth/auth.guard'

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    getUser(@AuthContext() authContext: AuthContextType) {
        return authContext.user
    }

    @Delete()
    deleteUser(@AuthContext() authContext: AuthContextType) {
        return this.userService.deleteUser(authContext.user.id)
    }
}
