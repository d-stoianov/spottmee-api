import { Controller, Delete, Get, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { AuthContext } from 'src/auth/auth-context.decorator'
import { AuthContextType, AuthGuard } from 'src/auth/auth.guard'

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
