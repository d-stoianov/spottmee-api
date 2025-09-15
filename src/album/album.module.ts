import { Module } from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { AlbumController } from '@/album/album.controller'
import { UserService } from '@/user/user.service'
import { PhotoService } from '@/photo/photo.service'

@Module({
    providers: [AlbumService, UserService, PhotoService],
    controllers: [AlbumController],
    exports: [AlbumService],
})
export class AlbumModule {}
