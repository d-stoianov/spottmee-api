import { Controller, Get, Param, NotFoundException } from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { MatchAlbumDto } from '@/match-album/schemas/match-album.schema'

@Controller('match-albums')
export class MatchAlbumController {
    constructor(private readonly albumService: AlbumService) {}

    @Get(':id')
    async getAlbum(@Param('id') albumId: string): Promise<MatchAlbumDto> {
        const album = await this.albumService.getAlbum(albumId)

        if (!album) {
            throw new NotFoundException('Album not found')
        }

        const matchAlbum =
            await this.albumService.serializeToMatchAlbumDto(album)
        return matchAlbum
    }
}
