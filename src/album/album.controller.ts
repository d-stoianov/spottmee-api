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
    BadRequestException,
} from '@nestjs/common'

import { AlbumService } from '@/album/album.service'
import { AuthContext } from '@/auth/auth-context.decorator'
import { AuthGuard, AuthContextType } from '@/auth/auth.guard'

import { createAlbumSchema } from '@/album/schemas/create-album.schema'
import { updateAlbumSchema } from '@/album/schemas/update-album.schema'
import { AlbumDto } from '@/album/schemas/album.schema'
import { FilesInterceptor } from '@nestjs/platform-express'
import { NsfwService } from '@/nsfw/nsfw.service'

@UseGuards(AuthGuard)
@Controller('albums')
export class AlbumController {
    constructor(
        private readonly albumService: AlbumService,
        private readonly nsfwService: NsfwService,
    ) {}

    @Post()
    @UseInterceptors(FilesInterceptor('coverImage', 1))
    async createAlbum(
        @AuthContext() authContext: AuthContextType,
        @Body() body: any,
        @UploadedFiles() files: Express.Multer.File[],
    ): Promise<AlbumDto> {
        const coverImage = files?.[0]

        // check for NSFW
        const isSafe = await this.nsfwService.isSafeImage(coverImage.buffer)

        if (!isSafe) {
            throw new BadRequestException(
                'Cover photo is inappropriate or NSFW',
            )
        }

        const dto = createAlbumSchema.parse({
            ...body,
            coverImage,
        })

        const album = await this.albumService.createAlbum(
            authContext.user.id,
            dto,
        )

        return this.albumService.serializeToAlbumDto(album)
    }

    @Get()
    async getAlbums(
        @AuthContext() authContext: AuthContextType,
    ): Promise<AlbumDto[]> {
        const albums = await this.albumService.getAlbumsByUserId(
            authContext.user.id,
        )

        return Promise.all(
            albums.map((al) => this.albumService.serializeToAlbumDto(al)),
        )
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

        return this.albumService.serializeToAlbumDto(album)
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

        // check for NSFW
        const isSafe = await this.nsfwService.isSafeImage(coverImage.buffer)

        if (!isSafe) {
            throw new BadRequestException(
                'Cover photo is inappropriate or NSFW',
            )
        }

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

        return this.albumService.serializeToAlbumDto(album)
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
    }
}
