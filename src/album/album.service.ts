import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { Album } from '@prisma/client'

import { PrismaService } from '@/prisma/prisma.service'
import { CreateAlbumDto } from './schemas/create-album.schema'
import { UpdateAlbumDto } from './schemas/update-album.schema'
import { FirebaseService } from '@/firebase/firebase.service'

@Injectable()
export class AlbumService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebase: FirebaseService,
    ) {}

    async createAlbum(
        userId: string,
        albumDto: CreateAlbumDto,
    ): Promise<Album> {
        const { name, description, coverImage } = albumDto

        const album = await this.prisma.album.create({
            data: {
                creatorId: userId,
                name,
                description,
            },
        })

        let coverImageUrl: string | null = null

        if (coverImage) {
            coverImageUrl = await this.firebase.uploadFile(
                `albums/${album.id}`,
                coverImage,
            )
        }

        return this.prisma.album.update({
            where: { id: album.id },
            data: {
                coverImageUrl,
            },
        })
    }

    async assertUserHasAccess(userId: string, albumId: string): Promise<Album> {
        const album = await this.prisma.album.findFirst({
            where: { id: albumId },
        })

        if (!album) {
            throw new NotFoundException('Album not found')
        }

        if (album.creatorId !== userId) {
            throw new ForbiddenException('You do not have access to this album')
        }

        return album
    }

    async getAlbumsByUserId(userId: string): Promise<Album[]> {
        return this.prisma.album.findMany({
            where: { creatorId: userId },
        })
    }

    async updateAlbumById(
        userId: string,
        id: string,
        albumDto: UpdateAlbumDto,
    ): Promise<Album | null> {
        const { name, description, coverImage } = albumDto

        let coverImageUrl: string | null = null

        // upload new album cover to the bucket
        if (coverImage) {
            coverImageUrl = await this.firebase.uploadFile(
                `albums/${id}`,
                coverImage,
            )

            // TODO: initiate a job to remove old cover from the bucket
        }

        return this.prisma.album.update({
            where: { creatorId: userId, id },
            data: { name, description, coverImageUrl },
        })
    }

    async deleteAlbumById(userId: string, id: string): Promise<Album | null> {
        // initiate a job to delete album cover, album photo from the bucket

        return this.prisma.album.delete({
            where: { creatorId: userId, id },
        })
    }
}
