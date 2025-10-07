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
import {
    MatchAlbumDto,
    matchAlbumSchema,
} from '@/match-album/schemas/match-album.schema'
import { UserService } from '@/user/user.service'
import { PhotoService } from '@/photo/photo.service'

@Injectable()
export class AlbumService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly firebase: FirebaseService,
        private readonly photoService: PhotoService,
        private readonly userService: UserService,
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

    async getAlbum(id: string): Promise<Album | null> {
        return this.prisma.album.findFirst({
            where: { id },
        })
    }

    async getAlbumsByUserId(userId: string): Promise<Album[]> {
        return this.prisma.album.findMany({
            where: { creator_id: userId },
        })
    }

    async incrementMatchCount(albumId: string): Promise<Album> {
        return this.prisma.album.update({
            where: { id: albumId },
            data: {
                matches_count: { increment: 1 },
            },
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
        }
        return this.prisma.album.delete({
            where: { creator_id: userId, id },
        })
    }

    public async serializeToAlbumDto(album: Album): Promise<AlbumDto> {
        const coverImageUrl = album.cover_image_name
            ? `${this.firebase.getPublicBucketLink()}/albums/${album.id}/${album.cover_image_name}`
            : undefined

        const allPhotos = await this.photoService.getPhotos(album.id)

        const albumSize = allPhotos.reduce((prev, curr) => prev + curr.size, 0)

        return albumSchema.parse({
            id: album.id,
            name: album.name,
            createdAt: album.created_at,
            description: album.description ?? undefined,
            coverImageUrl: coverImageUrl,
            totalPhotosCount: allPhotos.length,
            matchesCount: album.matches_count,
            size: albumSize,
        })
    }

    public async serializeToMatchAlbumDto(
        album: Album,
    ): Promise<MatchAlbumDto> {
        const coverImageUrl = album.cover_image_name
            ? `${this.firebase.getPublicBucketLink()}/albums/${album.id}/${album.cover_image_name}`
            : undefined
        const user = await this.userService.getUser(album.creator_id)

        if (!user) throw new Error(`No user found by id - ${album.creator_id}`)

        const photosCount = await this.photoService.getPhotosCount(album.id)

        const MAX_PREVIEW_PHOTOS = 10
        const previewPhotos = await this.photoService.getRandomPhotos(
            album.id,
            MAX_PREVIEW_PHOTOS,
        )

        return matchAlbumSchema.parse({
            id: album.id,
            name: album.name,
            creator: user.name,
            totalPhotosCount: photosCount,
            previewPhotos: previewPhotos.map((photo) =>
                this.photoService.getPhotoUrl(photo),
            ),
            createdAt: album.created_at,
            description: album.description ?? undefined,
            coverImageUrl: coverImageUrl,
        })
    }
}
