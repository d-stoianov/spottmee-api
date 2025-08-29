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
import { PhotoDto, serializePhoto } from '@/photo/schemas/photo.schema'

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
    ): Promise<PhotoDto[]> {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const photos = await this.photoService.getPhotos(albumId)

        return photos.map((p) => serializePhoto(p))
    }
}
