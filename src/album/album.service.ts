import { Injectable } from '@nestjs/common'
import { Album } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateAlbumDto } from './dto/create-album.dto'

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

    async getAlbumsByUserId(userId: string): Promise<Album[]> {
        return this.prisma.album.findMany({
            where: { creatorId: userId },
        })
    }

    async getAlbumById(userId: string, id: string): Promise<Album | null> {
        return this.prisma.album.findUnique({
            where: { creatorId: userId, id },
        })
    }

    async updateAlbumById(
        userId: string,
        id: string,
        albumDto: Partial<CreateAlbumDto>,
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
