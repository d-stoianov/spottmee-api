import { Injectable } from '@nestjs/common'
import { Photo } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

import { FirebaseService } from '@/firebase/firebase.service'
import { PrismaService } from '@/prisma/prisma.service'

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

                const url = await this.uploadPhotoToFirebase(albumId, photo, id)

                return this.prisma.photo.create({
                    data: {
                        id,
                        albumId,
                        name: photo.originalname,
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

    async getPhotos(albumId: string): Promise<Photo[]> {
        return this.prisma.photo.findMany({ where: { albumId } })
    }

    private async uploadPhotoToFirebase(
        albumId: string,
        file: Express.Multer.File,
        fileId: string,
    ): Promise<string> {
        const bucket = this.firebase.getStorage().bucket()

        const fileExtension = file.originalname.split('.').pop()

        const blob = bucket.file(`albums/${albumId}/${fileId}.${fileExtension}`)
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        })

        return new Promise<string>((resolve, reject) => {
            blobStream.on('error', reject)

            blobStream.on('finish', async () => {
                await blob.makePublic()

                const url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
                resolve(url)
            })

            blobStream.end(file.buffer)
        })
    }
}
