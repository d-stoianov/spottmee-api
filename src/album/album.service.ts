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
import { AlbumDto, albumSchema } from '@/album/schemas/album.schema'

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
                creator_id: userId,
                name,
                description,
            },
        })

        let coverImageName: string | undefined = undefined

        if (coverImage) {
            const coverImageUrl = await this.firebase.uploadFile(
                coverImage,
                `albums/${album.id}`,
            )
            coverImageName = coverImageUrl.split('/').pop()
        }

        return this.prisma.album.update({
            where: { id: album.id },
            data: {
                cover_image_name: coverImageName,
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

        if (album.creator_id !== userId) {
            throw new ForbiddenException('You do not have access to this album')
        }

        return album
    }

    async getAlbumsByUserId(userId: string): Promise<Album[]> {
        return this.prisma.album.findMany({
            where: { creator_id: userId },
        })
    }

    async updateAlbumById(
        userId: string,
        id: string,
        albumDto: UpdateAlbumDto,
    ): Promise<Album> {
        const { name, description, coverImage } = albumDto

        const oldAlbum = await this.prisma.album.findFirst({
            where: { id, creator_id: userId },
        })

        let coverImageName: string | undefined = undefined

        // upload new album cover to the bucket
        if (coverImage) {
            const coverImageUrl = await this.firebase.uploadFile(
                coverImage,
                `albums/${id}`,
            )
            coverImageName = coverImageUrl.split('/').pop()

            // delete old album cover from the bucket
            if (oldAlbum?.cover_image_name) {
                await this.firebase.deleteFile(
                    `albums/${id}/${oldAlbum.cover_image_name}`,
                )
            }
        }

        return this.prisma.album.update({
            where: { creator_id: userId, id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(coverImageName ? { cover_image_name: coverImageName } : {}),
            },
        })
    }

    async deleteAlbumById(userId: string, id: string): Promise<Album | null> {
        try {
            // clear everything in the bucket under albums/albumId path
            const folderPath = `albums/${id}`
            const files = await this.firebase.listFiles(folderPath)

            if (files.length) {
                await Promise.all(
                    files.map((filePath) => this.firebase.deleteFile(filePath)),
                )
            }
        } catch (error) {
            console.error("Couldn't cleanup the bucket - ", error)
        } finally {
            return this.prisma.album.delete({
                where: { creator_id: userId, id },
            })
        }
    }

    public serialize(album: Album): AlbumDto {
        const coverImageUrl = album.cover_image_name
            ? `${this.firebase.getPublicBucketLink()}/albums/${album.id}/${album.cover_image_name}`
            : undefined

        return albumSchema.parse({
            id: album.id,
            name: album.name,
            createdAt: album.createdAt,
            description: album.description ?? undefined,
            coverImageUrl: coverImageUrl,
        })
    }
}
