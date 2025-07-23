import { Body, Controller, Post } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UserService } from 'src/user/user.service'

@Controller('auth')
export class AuthController {
    constructor(private readonly userService: UserService) {}

    @Post('sign-up')
    signUp(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto)
    }
}
