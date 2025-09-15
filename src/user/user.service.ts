import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    deleteUser(id: string) {
        return this.prisma.user.delete({ where: { id } })
    }

    getUser(id: string) {
        return this.prisma.user.findFirst({ where: { id } })
    }
}
