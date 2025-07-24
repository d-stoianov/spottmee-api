import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthGuard, AuthContextType } from '@/auth/auth.guard'
import { CreateAlbumDto } from '@/album/dto/create-album.dto'
import { UpdateAlbumDto } from '@/album/dto/update-album.dto'

@UseGuards(AuthGuard)
@Controller('albums')
export class AlbumController {
    constructor(private readonly albumService: AlbumService) {}

    @Post()
    async createAlbum(
        @AuthContext() authContext: AuthContextType,
        @Body() body: CreateAlbumDto,
    ) {
        const { name, description } = body
        return this.albumService.createAlbum(authContext.user.id, {
            name,
            description,
        })
    }

    @Get()
    async getAlbums(@AuthContext() authContext: AuthContextType) {
        return this.albumService.getAlbumsByUserId(authContext.user.id)
    }

    @Get(':id')
    async getAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
    ) {
        return this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )
    }

    @Put(':id')
    async updateAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Body() body: UpdateAlbumDto,
    ) {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const { name, description } = body
        return this.albumService.updateAlbumById(authContext.user.id, albumId, {
            name,
            description,
        })
    }

    @Delete(':id')
    async deleteAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
    ) {
        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        return this.albumService.deleteAlbumById(authContext.user.id, albumId)
    }
}
