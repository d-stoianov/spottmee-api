import { Body, Controller, Post, Req } from '@nestjs/common'

import { AuthService } from '@/auth/auth.service'
import { createUserSchema } from './schemas/create-user.schema'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('sign-up')
    signUp(@Body() body: any, @Req() req: Request) {
        const token = req.headers['authorization']?.split(' ')[1] // get jwt

        if (token) {
            return this.authService.createUserWithProvider(token)
        } else {
            const createUserDto = createUserSchema.parse(body)
            return this.authService.createUser(createUserDto)
        }
    }
}
