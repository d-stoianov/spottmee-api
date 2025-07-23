import { Injectable } from '@nestjs/common'
import { Photo } from '@prisma/client'
import { FirebaseService } from 'src/firebase/firebase.service'
import { PrismaService } from 'src/prisma/prisma.service'

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
                const url = await this.uploadPhotoToFirebase(albumId, photo)

                return this.prisma.photo.create({
                    data: {
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
    ): Promise<string> {
        const bucket = this.firebase.getStorage().bucket()

        const sanitizedName = file.originalname.replace(/\s+/g, '-')

        const blob = bucket.file(`albums/${albumId}/${sanitizedName}`)
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
