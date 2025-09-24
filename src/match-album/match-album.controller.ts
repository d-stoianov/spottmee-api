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

@Controller('match-albums')
export class MatchAlbumController {
    constructor(
        private readonly albumService: AlbumService,
        private readonly photoService: PhotoService,
        private readonly queueService: QueueService,
    ) {}

    @Get(':id')
    async getAlbum(@Param('id') albumId: string): Promise<MatchAlbumDto> {
        const album = await this.albumService.getAlbum(albumId)

        if (!album) {
            throw new NotFoundException('Album not found')
        }

        return await this.albumService.serializeToMatchAlbumDto(album)
    }

    // start matching process
    @Post(':id')
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

        const storedIds = photos.map((photo) => `${albumId}/${photo.id}`)

        const matchId = uuid()

        await this.queueService.addCompareJob(
            matchId,
            storedIds,
            selfie[0].buffer.toString('base64'),
        )

        return matchId
    }
}
