import { Module } from '@nestjs/common'

import { MatchAlbumController } from '@/match-album/match-album.controller'

import { AlbumModule } from '@/album/album.module'
import { PhotoModule } from '@/photo/photo.module'

@Module({
    imports: [AlbumModule, PhotoModule],
    controllers: [MatchAlbumController],
})
export class MatchAlbumModule {}
