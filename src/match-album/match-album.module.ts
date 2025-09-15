import { Module } from '@nestjs/common'

import { MatchAlbumController } from '@/match-album/match-album.controller'

import { AlbumModule } from '@/album/album.module'

@Module({
    imports: [AlbumModule],
    controllers: [MatchAlbumController],
})
export class MatchAlbumModule {}
