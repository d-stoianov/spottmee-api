import {  Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { UserService } from 'src/user/user.service'

@Module({
    providers: [UserService],
    controllers: [AuthController],
})
export class AuthModule {}
