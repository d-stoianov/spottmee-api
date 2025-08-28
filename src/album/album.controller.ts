import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthGuard, AuthContextType } from '@/auth/auth.guard'

import { createAlbumSchema } from '@/album/schemas/create-album.schema'
import { updateAlbumSchema } from '@/album/schemas/update-album.schema'
import { AlbumDto, albumSchema } from '@/album/schemas/album.schema'

@UseGuards(AuthGuard)
@Controller('albums')
export class AlbumController {
    constructor(private readonly albumService: AlbumService) {}

    @Post()
    async createAlbum(
        @AuthContext() authContext: AuthContextType,
        @Body() body: any,
    ): Promise<AlbumDto> {
        const { name, description } = createAlbumSchema.parse(body)

        const album = await this.albumService.createAlbum(authContext.user.id, {
            name,
            description,
        })

        console.log(album)

        return albumSchema.parse(album)
    }

    @Get()
    async getAlbums(
        @AuthContext() authContext: AuthContextType,
    ): Promise<AlbumDto[]> {
        const albums = await this.albumService.getAlbumsByUserId(
            authContext.user.id,
        )

        return albums.map((al) => albumSchema.parse(al))
    }

    @Get(':id')
    async getAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
    ): Promise<AlbumDto> {
        const album = await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        return albumSchema.parse(album)
    }

    @Put(':id')
    async updateAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Body() body: any,
    ): Promise<AlbumDto> {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const { name, description } = updateAlbumSchema.parse(body)

        const album = await this.albumService.updateAlbumById(
            authContext.user.id,
            albumId,
            {
                name,
                description,
            },
        )

        return albumSchema.parse(album)
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
    ) {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        this.albumService.deleteAlbumById(authContext.user.id, albumId)
    }
}
