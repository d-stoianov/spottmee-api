import {
    Controller,
    Get,
    InternalServerErrorException,
    NotFoundException,
    Param,
    Post,
    Query,
    Res,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'
import { Response } from 'express'

import { AlbumService } from '@/album/album.service'
import { MatchAlbumDto } from '@/match-album/schemas/match-album.schema'
import { QueueService } from '@/queue/queue.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { PhotoService } from '@/photo/photo.service'
import { v4 as uuid } from 'uuid'
import * as archiver from 'archiver'
import { RedisService } from '@/queue/redis.service'
import { MatchResultDto } from '@/match-album/schemas/match-result.schema'
import * as https from 'node:https'
import * as http from 'node:http'
import { PhotoDto } from '@/photo/schemas/photo.schema'

@Controller('match-albums/:id')
export class MatchAlbumController {
    constructor(
        private readonly albumService: AlbumService,
        private readonly photoService: PhotoService,
        private readonly queueService: QueueService,
        private readonly redisService: RedisService,
    ) {}

    @Get()
    async getAlbum(@Param('id') albumId: string): Promise<MatchAlbumDto> {
        const album = await this.albumService.getAlbum(albumId)

        if (!album) {
            throw new NotFoundException('Album not found')
        }

        return await this.albumService.serializeToMatchAlbumDto(album)
    }

    // start matching process
    @Post()
    @UseInterceptors(FilesInterceptor('selfie', 1))
    async matchSelfieWithAlbum(
        @Param('id') albumId: string,
        @UploadedFiles() selfie: Express.Multer.File[],
    ): Promise<string> {
        const album = await this.albumService.getAlbum(albumId)

        if (!album) {
            throw new NotFoundException('Album not found')
        }

        const photos = await this.photoService.getPhotos(album.id)

        const storedIds = photos.map((photo) => photo.id)

        const matchId = uuid()

        await this.queueService.addCompareJob(
            matchId,
            storedIds,
            selfie[0].buffer.toString('base64'),
        )

        const matchResultKey = `match-result:${matchId}`
        await this.redisService.set(matchResultKey, 'INITIATED')

        return matchId
    }

    @Get(':matchId')
    async getMatchResult(
        @Param('id') albumId: string,
        @Param('matchId') matchId: string,
        @Query('offset') offset = 0,
        @Query('size') size = 20,
    ): Promise<MatchResultDto> {
        const album = await this.albumService.getAlbum(albumId)

        if (!album) {
            throw new NotFoundException('Album not found')
        }

        const matchResultKey = `match-result:${matchId}`

        const matchResult = await this.redisService.get(matchResultKey)

        if (!matchResult) {
            throw new NotFoundException('Match result not found')
        }

        const matchResultDto: MatchResultDto = {
            id: matchId,
            status: 'PROCESSING',
            matches: [],
            total: 0,
        }

        if (matchResult === 'PROCESSING' || matchResult === 'INITIATED') {
            return matchResultDto
        }

        const matchedIds: string[] = JSON.parse(matchResult) as string[]

        const start = Number(offset)
        const end = start + Number(size)
        const paginatedIds = matchedIds.slice(start, end)

        const allPhotos = await this.photoService.getPhotos(album.id)
        const filteredPhotos = allPhotos.filter((photo) =>
            paginatedIds.includes(photo.id),
        )

        const photoDtos = filteredPhotos.map((photo) =>
            this.photoService.serialize(photo),
        )

        matchResultDto.status = 'READY'
        matchResultDto.matches = photoDtos
        matchResultDto.total = matchedIds.length

        return matchResultDto
    }

    @Get(':matchId/download')
    async downloadMatchedPhotos(
        @Param('id') albumId: string,
        @Param('matchId') matchId: string,
        @Res() res: Response,
    ): Promise<void> {
        const album = await this.albumService.getAlbum(albumId)
        if (!album) throw new NotFoundException('Album not found')

        const matchResultKey = `match-result:${matchId}`
        const matchResult = await this.redisService.get(matchResultKey)
        if (!matchResult) throw new NotFoundException('Match result not found')

        if (matchResult === 'PROCESSING' || matchResult === 'INITIATED') {
            throw new NotFoundException('Match result not ready for download')
        }

        const matchedIds: string[] = JSON.parse(matchResult) as string[]
        if (matchedIds.length === 0)
            throw new NotFoundException('No matched photos to download')

        const allPhotos = await this.photoService.getPhotos(album.id)
        const filteredPhotos = allPhotos.filter((photo) =>
            matchedIds.includes(photo.id),
        )
        const photoDtos = filteredPhotos.map((photo) =>
            this.photoService.serialize(photo),
        )

        console.log('photoDtos', photoDtos)

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="spottmee-matched-${matchId}.zip"`,
        })

        const zip = archiver('zip', { zlib: { level: 9 } })
        zip.pipe(res as unknown as NodeJS.WritableStream)

        const addPhotoToZip = (photo: PhotoDto): Promise<void> => {
            return new Promise((resolve, reject) => {
                const client = photo.url.startsWith('https') ? https : http
                client
                    .get(photo.url, (stream) => {
                        zip.append(stream, {
                            name: filteredPhotos[
                                filteredPhotos.findIndex(
                                    (p) => p.id === photo.id,
                                )
                            ].normalized_name,
                        })
                        stream.on('end', resolve)
                        stream.on('error', reject)
                    })
                    .on('error', reject)
            })
        }

        try {
            for (const photo of photoDtos) {
                await addPhotoToZip(photo) // sequentially fetch and append
            }
            await zip.finalize()
        } catch (err) {
            console.error('Error creating zip:', err)
            if (err instanceof Error) {
                throw new InternalServerErrorException(err.message)
            }
        }

        zip.on('error', (err) => {
            throw new InternalServerErrorException(err.message)
        })
    }
}
