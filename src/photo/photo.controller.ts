import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'

import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthContextType } from '@/auth/auth.guard'
import { PhotoService } from '@/photo/photo.service'

@Controller('albums/:id/photos')
export class PhotoController {
    constructor(private readonly photoService: PhotoService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 500))
    async uploadPhotos(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @UploadedFiles() photos: Express.Multer.File[],
    ) {
        console.log('photos', photos)
        return this.photoService.uploadPhotos(albumId, photos)
    }

    @Get()
    async getPhotosFromAlbum(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
    ) {
        // check if album is accesible for that user
        return this.photoService.getPhotos(albumId)
    }
}
