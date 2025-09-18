import {
    Body,
    Controller,
    Delete,
    Get,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'

import { UserService } from '@/user/user.service'
import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthContextType, AuthGuard } from '@/auth/auth.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { updateUserSchema } from '@/user/schemas/update-user.schema'

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

    @Put()
    @UseInterceptors(FileInterceptor('picture'))
    updateUser(
        @AuthContext() authContext: AuthContextType,
        @Body() body: any,
        @UploadedFile() picture?: Express.Multer.File,
    ) {
        const dto = updateUserSchema.parse({
            ...body,
            picture,
        })

        return this.userService.updateUser(authContext.user.id, dto)
    }
}
