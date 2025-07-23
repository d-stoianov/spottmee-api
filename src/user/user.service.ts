import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    deleteUser(id: string) {
        return this.prisma.user.delete({ where: { id } })
    }
}
