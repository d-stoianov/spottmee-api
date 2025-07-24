import { Module } from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { AlbumController } from '@/album/album.controller'

@Module({
    providers: [AlbumService],
    controllers: [AlbumController],
    exports: [AlbumService]
})
export class AlbumModule {}
