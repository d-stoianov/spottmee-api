import { AlbumService } from '@/album/album.service'
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class AlbumAccessGuard implements CanActivate {
    constructor(private readonly albumService: AlbumService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const userId = request.authContext.user?.id // comes from AuthGuard
        const albumId = request.params.id
        await this.albumService.assertUserHasAccess(userId, albumId)
        return true
    }
}
