import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'

import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthContextType, AuthGuard } from '@/auth/auth.guard'
import { PhotoService } from '@/photo/photo.service'
import { AlbumService } from '@/album/album.service'

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
        @UploadedFiles() photos: Express.Multer.File[],
    ) {
        if (!photos || photos.length === 0) {
            throw new BadRequestException('No photos were uploaded')
        }

        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        return this.photoService.uploadPhotos(albumId, photos)
    }

    @Get()
    async getPhotosFromAlbum(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
    ) {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        return this.photoService.getPhotos(albumId)
    }
}
