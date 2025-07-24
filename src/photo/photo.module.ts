import { Module } from '@nestjs/common'

import { PhotoService } from '@/photo/photo.service'
import { PhotoController } from '@/photo/photo.controller'
import { AlbumModule } from '@/album/album.module'

@Module({
    imports: [AlbumModule],
    providers: [PhotoService],
    controllers: [PhotoController],
})
export class PhotoModule {}
