import { Injectable } from '@nestjs/common'

import { PrismaService } from '@/prisma/prisma.service'
import { UpdateUserDto } from '@/user/schemas/update-user.schema'
import { FirebaseService } from '@/firebase/firebase.service'

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebase: FirebaseService,
    ) {}

    deleteUser(id: string) {
        return this.prisma.user.delete({ where: { id } })
    }

    getUser(id: string) {
        return this.prisma.user.findFirst({ where: { id } })
    }

    async updateUser(userId: string, userDto: UpdateUserDto) {
        const { name, picture } = userDto

        const oldUser = await this.prisma.user.findFirst({
            where: { id: userId },
        })

        let pictureUrl: string | undefined = undefined

        if (picture) {
            // upload image to the bucket
            pictureUrl = await this.firebase.uploadFile(
                picture,
                `users/${userId}`,
            )

            // delete old user picture from the bucket,
            // if it was uploaded before through the service and not set from google
            if (
                oldUser?.picture &&
                oldUser?.picture.startsWith(this.firebase.getPublicBucketLink())
            ) {
                const oldPictureFileName = oldUser.picture.split('/').pop()
                await this.firebase.deleteFile(
                    `users/${userId}/${oldPictureFileName}`,
                )
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(pictureUrl ? { picture: pictureUrl } : {}),
            },
        })
    }
}
