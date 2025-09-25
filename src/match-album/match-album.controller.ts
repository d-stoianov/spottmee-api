import {
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { MatchAlbumDto } from '@/match-album/schemas/match-album.schema'
import { QueueService } from '@/queue/queue.service'
import { FilesInterceptor } from '@nestjs/platform-express'
import { PhotoService } from '@/photo/photo.service'
import { v4 as uuid } from 'uuid'
import { RedisService } from '@/queue/redis.service'
import { MatchResultDto } from '@/match-album/schemas/match-result.schema'

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
        }

        if (matchResult === 'PROCESSING' || matchResult === 'INITIATED') {
            return matchResultDto
        }

        const matchedIds: string[] = JSON.parse(matchResult) as string[]

        const allPhotos = await this.photoService.getPhotos(album.id)
        const filteredPhotos = allPhotos.filter(
            (photo) => matchedIds.includes(photo.id), // keep the same format as we wrote to that queue
        )

        matchResultDto.status = 'READY'
        matchResultDto.matches = filteredPhotos.map((photo) =>
            this.photoService.serialize(photo),
        )

        return matchResultDto
    }
}
