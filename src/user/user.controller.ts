import { Controller, Get, Post } from '@nestjs/common'
import { UserService } from './user.service'

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async create() {
        return this.userService.createUser('dima@gmail.com', '123')
    }

    @Get()
    async findAll() {
        return this.userService.getUsers()
    }
}
