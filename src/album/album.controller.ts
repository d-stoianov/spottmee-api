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
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthGuard, AuthContextType } from '@/auth/auth.guard'

import { createAlbumSchema } from '@/album/schemas/create-album.schema'
import { updateAlbumSchema } from '@/album/schemas/update-album.schema'
import {
    AlbumDto,
    albumSchema,
    serializeAlbum,
} from '@/album/schemas/album.schema'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiNoContentResponse } from '@nestjs/swagger'

@UseGuards(AuthGuard)
@Controller('albums')
export class AlbumController {
    constructor(private readonly albumService: AlbumService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('coverImage', 1))
    async createAlbum(
        @AuthContext() authContext: AuthContextType,
        @Body() body: any,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<AlbumDto> {
        const coverImage = files?.[0]

        const dto = createAlbumSchema.parse({
            ...body,
            coverImage,
        })

        const album = await this.albumService.createAlbum(
            authContext.user.id,
            dto,
        )

        return serializeAlbum(album)
    }

    @Get()
    async getAlbums(
        @AuthContext() authContext: AuthContextType,
    ): Promise<AlbumDto[]> {
        const albums = await this.albumService.getAlbumsByUserId(
            authContext.user.id,
        )

        return albums.map((al) => serializeAlbum(al))
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

        return serializeAlbum(album)
    }

    @Put(':id')
    @UseInterceptors(FilesInterceptor('coverImage', 1))
    async updateAlbumById(
        @AuthContext() authContext: AuthContextType,
        @Param('id') albumId: string,
        @Body() body: any,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<AlbumDto> {
        const coverImage = files?.[0]

        const dto = updateAlbumSchema.parse({
            ...body,
            ...(coverImage ? { coverImage } : {}),
        })

        await this.albumService.assertUserHasAccess(
            authContext.user.id,
            albumId,
        )

        const album = await this.albumService.updateAlbumById(
            authContext.user.id,
            albumId,
            dto,
        )

        return serializeAlbum(album)
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
        // TODO: cascade delete photos table

        await this.albumService.deleteAlbumById(authContext.user.id, albumId)

        return ApiNoContentResponse
    }
}
