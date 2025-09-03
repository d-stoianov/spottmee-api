import {
    BadRequestException,
    Body,
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

import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthContextType, AuthGuard } from '@/auth/auth.guard'
import { PhotoService } from '@/photo/photo.service'
import { AlbumService } from '@/album/album.service'
import { PhotoDto } from '@/photo/schemas/photo.schema'

type PhotosResponse = {
    photos: PhotoDto[]
    total: number
}

@UseGuards(AuthGuard)
@Controller('albums/:id/photos')
export class PhotoController {
    constructor(
        private readonly photoService: PhotoService,
        private readonly albumService: AlbumService,
    ) {}

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 500))
    async uploadPhotos(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<PhotosResponse> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No photos were uploaded')
        }

        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const photos = await this.photoService.uploadPhotos(albumId, files)

        return {
            photos: photos.map((p) => this.photoService.serialize(p)),
            total: photos.length,
        }
    }

    @Get()
    async getPhotosFromAlbum(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Query('offset') offset = 0,
        @Query('size') size = 20,
    ): Promise<PhotosResponse> {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const offsetNum = Number(offset)
        const sizeNum = Number(size)

        const [photos, photosCount] = await Promise.all([
            this.photoService.getPhotos(albumId, offsetNum, sizeNum),
            this.photoService.getPhotosCount(albumId),
        ])

        return {
            photos: photos.map((p) => this.photoService.serialize(p)),
            total: photosCount,
        }
    }

    @Get(':photoId')
    async getPhotoById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Param('photoId') photoId: string,
    ): Promise<PhotoDto> {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const photo = await this.photoService.getPhotoById(albumId, photoId)

        if (!photo) {
            throw new NotFoundException('Photo not found')
        }

        return this.photoService.serialize(photo)
    }

    @Delete(':photoId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deletePhotoById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Param('photoId') photoId: string,
    ) {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const deletedPhoto = await this.photoService.deletePhotoById(
            albumId,
            photoId,
        )

        if (!deletedPhoto) {
            throw new NotFoundException('Photo not found')
        }
    }
}
