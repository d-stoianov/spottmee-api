import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common'
import { AlbumService } from '@/album/album.service'
import { PhotoService } from '@/photo/photo.service'
import { QueueService } from '@/queue/queue.service'
import { RedisService } from '@/queue/redis.service'
import { v4 as uuid } from 'uuid'
import { MatchResultDto } from './schemas/match-result.schema'
import { PhotoDto } from '@/photo/schemas/photo.schema'
import * as archiver from 'archiver'
import * as https from 'node:https'
import * as http from 'node:http'
import { Response } from 'express'

@Injectable()
export class MatchAlbumService {
    constructor(
        private readonly albumService: AlbumService,
        private readonly photoService: PhotoService,
        private readonly queueService: QueueService,
        private readonly redisService: RedisService,
    ) {}

    async matchSelfie(albumId: string, selfieBuffer: Buffer): Promise<string> {
        const album = await this.albumService.getAlbum(albumId)
        if (!album) throw new NotFoundException('Album not found')

        const photos = await this.photoService.getPhotos(album.id)
        const storedIds = photos.map((p) => p.id)

        const matchId = uuid()
        await this.queueService.addCompareJob(
            matchId,
            storedIds,
            selfieBuffer.toString('base64'),
        )
        await this.redisService.set(`match-result:${matchId}`, 'INITIATED')

        return matchId
    }

    async getMatchResult(
        albumId: string,
        matchId: string,
        offset = 0,
        size = 20,
    ): Promise<MatchResultDto> {
        const album = await this.albumService.getAlbum(albumId)
        if (!album) throw new NotFoundException('Album not found')

        const matchResult = await this.redisService.get(
            `match-result:${matchId}`,
        )
        if (!matchResult) throw new NotFoundException('Match result not found')

        if (matchResult === 'PROCESSING' || matchResult === 'INITIATED') {
            return { id: matchId, status: 'PROCESSING', matches: [], total: 0 }
        }

        const matchedIds: string[] = JSON.parse(matchResult) as string[]

        const allPhotos = await this.photoService.getPhotos(album.id)
        const filteredPhotos = allPhotos.filter((p) =>
            matchedIds.includes(p.id),
        )
        const photoDtos = filteredPhotos
            .slice(Number(offset), Number(offset) + Number(size))
            .map((p) => this.photoService.serialize(p))

        return {
            id: matchId,
            status: 'READY',
            matches: photoDtos,
            total: matchedIds.length,
        }
    }

    async downloadMatchedPhotos(
        albumId: string,
        matchId: string,
        res: Response,
    ): Promise<void> {
        const album = await this.albumService.getAlbum(albumId)
        if (!album) throw new NotFoundException('Album not found')

        const matchResult = await this.redisService.get(
            `match-result:${matchId}`,
        )

        if (!matchResult) throw new NotFoundException('Match result not found')

        if (matchResult === 'PROCESSING' || matchResult === 'INITIATED') {
            throw new NotFoundException('Match result not ready for download')
        }

        const matchedIds: string[] = JSON.parse(matchResult) as string[]

        if (!matchedIds.length)
            throw new NotFoundException('No matched photos to download')

        const allPhotos = await this.photoService.getPhotos(album.id)
        const filteredPhotos = allPhotos.filter((p) =>
            matchedIds.includes(p.id),
        )
        const photoDtos = filteredPhotos.map((p) =>
            this.photoService.serialize(p),
        )

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="spottmee-matched-${matchId}.zip"`,
        })

        const zip = archiver('zip', { zlib: { level: 9 } })
        zip.pipe(res as unknown as NodeJS.WritableStream)

        const addPhotoToZip = (photo: PhotoDto): Promise<void> =>
            new Promise((resolve, reject) => {
                const client = photo.url.startsWith('https') ? https : http
                client
                    .get(photo.url, (stream) => {
                        zip.append(stream, {
                            name: filteredPhotos[
                                filteredPhotos.findIndex(
                                    (p) => p.id === photo.id,
                                )
                            ].normalized_name,
                        })
                        stream.on('end', resolve)
                        stream.on('error', reject)
                    })
                    .on('error', reject)
            })

        try {
            for (const photo of photoDtos) {
                await addPhotoToZip(photo)
            }
            await zip.finalize()
        } catch (err) {
            throw new InternalServerErrorException(
                err instanceof Error ? err.message : 'Error creating zip',
            )
        }
    }
}
