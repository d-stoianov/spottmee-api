import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { Album } from '@prisma/client'

import { PrismaService } from '@/prisma/prisma.service'
import { CreateAlbumDto } from '@/album/dto/create-album.dto'
import { UpdateAlbumDto } from './dto/update-album.dto'

@Injectable()
export class AlbumService {
    constructor(private readonly prisma: PrismaService) {}

    async createAlbum(
        userId: string,
        albumDto: CreateAlbumDto,
    ): Promise<Album> {
        const { name, description } = albumDto

        return this.prisma.album.create({
            data: {
                creatorId: userId,
                name,
                description,
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
        const { name, description } = albumDto
        return this.prisma.album.update({
            where: { creatorId: userId, id },
            data: { name, description },
        })
    }

    async deleteAlbumById(userId: string, id: string): Promise<Album | null> {
        return this.prisma.album.delete({
            where: { creatorId: userId, id },
        })
    }
}
