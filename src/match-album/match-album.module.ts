import { Module } from '@nestjs/common'

import { MatchAlbumController } from '@/match-album/match-album.controller'

import { AlbumModule } from '@/album/album.module'
import { PhotoModule } from '@/photo/photo.module'
import { MatchAlbumService } from '@/match-album/match-album.service'

@Module({
    imports: [AlbumModule, PhotoModule],
    controllers: [MatchAlbumController],
    providers: [MatchAlbumService],
})
export class MatchAlbumModule {}
