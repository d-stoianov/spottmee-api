import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
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
import { NsfwService } from '@/nsfw/nsfw.service'

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly nsfwService: NsfwService,
    ) {}

    @Get()
    getUser(@AuthContext() authContext: AuthContextType) {
        return authContext.user
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete()
    async deleteUser(@AuthContext() authContext: AuthContextType) {
        await this.userService.deleteUser(authContext.user.id)
    }

    @Put()
    @UseInterceptors(FileInterceptor('picture'))
    async updateUser(
        @AuthContext() authContext: AuthContextType,
        @Body() body: any,
        @UploadedFile() picture?: Express.Multer.File,
    ) {
        if (picture) {
            // check for NSFW
            const isSafe = await this.nsfwService.isSafeImage(picture.buffer)

            if (!isSafe) {
                throw new BadRequestException(
                    'Cover photo is inappropriate or NSFW',
                )
            }
        }

        const dto = updateUserSchema.parse({
            ...body,
            picture,
        })

        return this.userService.updateUser(authContext.user.id, dto)
    }
}
