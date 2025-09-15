import { Module } from '@nestjs/common'

import { UserService } from '@/user/user.service'
import { UserController } from '@/user/user.controller'

@Module({
    providers: [UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
