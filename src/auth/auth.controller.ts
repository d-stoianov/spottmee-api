import { Body, Controller, Post } from '@nestjs/common'

import { CreateUserDto } from '@/auth/dto/create-user.dto'
import { AuthService } from '@/auth/auth.service'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('sign-up')
    signUp(@Body() createUserDto: CreateUserDto) {
        return this.authService.createUser(createUserDto)
    }
}
