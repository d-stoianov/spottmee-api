import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common'
import { AuthContext } from 'src/auth/auth-context.decorator'
import { AuthContextType } from 'src/auth/auth.guard'
import { PhotoService } from './photo.service'
import { FilesInterceptor } from '@nestjs/platform-express'

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
