import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    Query,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'

import { AuthGuard } from '@/auth/auth.guard'
import { AlbumAccessGuard } from '@/album/album.guard'
import { PhotoService } from '@/photo/photo.service'
import { PhotoDto } from '@/photo/schemas/photo.schema'
import { QueueService } from '@/queue/queue.service'

type PhotosResponse = {
    photos: PhotoDto[]
    total: number
    readyCount: number
}

@UseGuards(AuthGuard, AlbumAccessGuard)
@Controller('albums/:id/photos')
export class PhotoController {
    constructor(
        private readonly photoService: PhotoService,
        private readonly queueService: QueueService,
    ) {}

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 500))
    async uploadPhotos(
        @Param('id') albumId: string,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<PhotosResponse> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No photos were uploaded')
        }

        const photos = await this.photoService.uploadPhotos(albumId, files)

        const serializedPhotos = photos.map((p) =>
            this.photoService.serialize(p),
        )

        // put photos into queue to start processing
        await Promise.all(
            serializedPhotos.map((photo) => {
                return this.queueService.addProcessJob(photo.url, photo.id)
            }),
        )

        return {
            photos: serializedPhotos,
            total: photos.length,
            readyCount: 0,
        }
    }

    @Get()
    async getPhotosFromAlbum(
        @Param('id') albumId: string,
        @Query('offset') offset = 0,
        @Query('size') size = 20,
    ): Promise<PhotosResponse> {
        const offsetNum = Number(offset)
        const sizeNum = Number(size)

        const [photos, photosCount, readyCount] = await Promise.all([
            this.photoService.getPhotos(albumId, offsetNum, sizeNum),
            this.photoService.getPhotosCount(albumId),
            this.photoService.getReadyCount(albumId),
        ])

        return {
            photos: photos.map((p) => this.photoService.serialize(p)),
            total: photosCount,
            readyCount: readyCount,
        }
    }

    @Get(':photoId')
    async getPhotoById(
        @Param('id') albumId: string,
        @Param('photoId') photoId: string,
    ): Promise<PhotoDto> {
        const photo = await this.photoService.getPhotoById(albumId, photoId)

        if (!photo) {
            throw new NotFoundException('Photo not found')
        }

        return this.photoService.serialize(photo)
    }

    @Delete(':photoId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePhotoById(
        @Param('id') albumId: string,
        @Param('photoId') photoId: string,
    ) {
        const deletedPhoto = await this.photoService.deletePhotoById(
            albumId,
            photoId,
        )

        if (!deletedPhoto) {
            throw new NotFoundException('Photo not found')
        }
    }
}
