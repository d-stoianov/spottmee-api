import { Injectable, NotFoundException } from '@nestjs/common'
import { Photo } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

import { FirebaseService } from '@/firebase/firebase.service'
import { PrismaService } from '@/prisma/prisma.service'
import { PhotoDto, photoSchema } from '@/photo/schemas/photo.schema'

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
                    photo,
                    `albums/${albumId}`,
                )

                const normalizedPhotoName = url.split('/').pop()

                return await this.prisma.photo.create({
                    data: {
                        id,
                        album_id: albumId,
                        original_name: photo.originalname,
                        normalized_name: normalizedPhotoName!,
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

    async getPhotosCount(albumId: string): Promise<number> {
        return this.prisma.photo.count({
            where: { album_id: albumId },
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
        const photo = await this.prisma.photo.findFirst({
            where: { id: photoId, album_id: albumId },
        })

        if (!photo) {
            throw new NotFoundException('Photo not found')
        }

        // delete photo from the bucket
        await this.firebase.deleteFile(
            `albums/${albumId}/${photo.normalized_name}`,
        )

        // delete in the db
        const deleted = await this.prisma.photo.deleteMany({
            where: { album_id: albumId, id: photoId },
        })

        if (deleted.count === 0) {
            return null
        }

        return { id: photoId, album_id: albumId } as Photo
    }

    public serialize(photo: Photo): PhotoDto {
        const photoUrl = `${this.firebase.getPublicBucketLink()}/albums/${photo.album_id}/${photo.normalized_name}`

        return photoSchema.parse({
            id: photo.id,
            albumId: photo.album_id,
            originalName: photo.original_name,
            url: photoUrl,
            size: photo.size,
            type: photo.type,
            createdAt: photo.created_at,
            status: photo.status,
        })
    }
}
