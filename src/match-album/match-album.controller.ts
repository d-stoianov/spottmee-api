import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Res,
    UploadedFiles,
    UseInterceptors,
    NotFoundException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { MatchAlbumService } from './match-album.service'
import { MatchAlbumDto } from './schemas/match-album.schema'
import { MatchResultDto } from './schemas/match-result.schema'
import { Response } from 'express'

@Controller('match-albums/:id')
export class MatchAlbumController {
    constructor(private readonly matchAlbumService: MatchAlbumService) {}

    @Get()
    async getAlbum(@Param('id') albumId: string): Promise<MatchAlbumDto> {
        return await this.matchAlbumService['albumService']
            .getAlbum(albumId)
            .then((album) =>
                album
                    ? this.matchAlbumService[
                          'albumService'
                      ].serializeToMatchAlbumDto(album)
                    : (() => {
                          throw new NotFoundException('Album not found')
                      })(),
            )
    }

    @Post()
    @UseInterceptors(FilesInterceptor('selfie', 1))
    async matchSelfieWithAlbum(
        @Param('id') albumId: string,
        @UploadedFiles() selfie: Express.Multer.File[],
    ): Promise<string> {
        return await this.matchAlbumService.matchSelfie(
            albumId,
            selfie[0].buffer,
        )
    }

    @Get(':matchId')
    async getMatchResult(
        @Param('id') albumId: string,
        @Param('matchId') matchId: string,
        @Query('offset') offset = 0,
        @Query('size') size = 20,
    ): Promise<MatchResultDto> {
        return await this.matchAlbumService.getMatchResult(
            albumId,
            matchId,
            offset,
            size,
        )
    }

    @Get(':matchId/download')
    async downloadMatchedPhotos(
        @Param('id') albumId: string,
        @Param('matchId') matchId: string,
        @Res() res: Response,
    ): Promise<void> {
        await this.matchAlbumService.downloadMatchedPhotos(
            albumId,
            matchId,
            res,
        )
    }
}
