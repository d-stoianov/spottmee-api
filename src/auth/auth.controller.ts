import { Body, Controller, Post } from '@nestjs/common'

import { AuthService } from '@/auth/auth.service'
import { createUserSchema } from './schemas/create-user.schema'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('sign-up')
    signUp(@Body() body: any) {
        const createUserDto = createUserSchema.parse(body)
        return this.authService.createUser(createUserDto)
    }
}
