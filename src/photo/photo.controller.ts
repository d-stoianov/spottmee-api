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
import { PhotoDto, serializePhoto } from '@/photo/schemas/photo.schema'
import { ApiNoContentResponse } from '@nestjs/swagger'

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
    ): Promise<PhotoDto[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No photos were uploaded')
        }

        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const photos = await this.photoService.uploadPhotos(albumId, files)

        return photos.map((p) => serializePhoto(p))
    }

    @Get()
    async getPhotosFromAlbum(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Query('offset') offset = 0,
        @Query('size') size = 20,
    ): Promise<PhotoDto[]> {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const offsetNum = Number(offset)
        const sizeNum = Number(size)

        const photos = await this.photoService.getPhotos(
            albumId,
            offsetNum,
            sizeNum,
        )

        return photos.map((p) => serializePhoto(p))
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

        return serializePhoto(photo)
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
