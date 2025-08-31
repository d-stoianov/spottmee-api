import { Injectable } from '@nestjs/common'
import { Album, Photo } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

import { FirebaseService } from '@/firebase/firebase.service'
import { PrismaService } from '@/prisma/prisma.service'
import { size } from 'zod'

@Injectable()
export class PhotoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebase: FirebaseService,
    ) {}

    async uploadPhotos(
        albumId: string,
        photos: Express.Multer.File[],
    ): Promise<Photo[]> {
        const uploadedPhotos = await Promise.all(
            photos.map(async (photo) => {
                const id = uuidv4()

                const url = await this.firebase.uploadFile(
                    `albums/${albumId}`,
                    photo,
                )

                return await this.prisma.photo.create({
                    data: {
                        id,
                        album_id: albumId,
                        original_name: photo.originalname,
                        url,
                        size: photo.size,
                        type: photo.mimetype,
                        status: 'UPLOADED',
                    },
                })
            }),
        )

        return uploadedPhotos
    }

    async getPhotos(
        albumId: string,
        offset: number,
        size: number,
    ): Promise<Photo[]> {
        return this.prisma.photo.findMany({
            where: { album_id: albumId },
            skip: offset,
            take: size,
            orderBy: {
                created_at: 'desc',
            },
        })
    }

    async getPhotoById(
        albumId: string,
        photoId: string,
    ): Promise<Photo | null> {
        return this.prisma.photo.findFirst({
            where: { album_id: albumId, id: photoId },
        })
    }

    async deletePhotoById(
        albumId: string,
        photoId: string,
    ): Promise<Photo | null> {
        const deleted = await this.prisma.photo.deleteMany({
            where: { album_id: albumId, id: photoId },
        })

        if (deleted.count === 0) {
            return null
        }

        return { id: photoId, album_id: albumId } as Photo
    }
}
