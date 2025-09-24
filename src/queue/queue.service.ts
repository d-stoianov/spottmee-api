import { Injectable } from '@nestjs/common'
import { RedisService } from '@/queue/redis.service'

@Injectable()
export class QueueService {
    private readonly PROCESS_QUEUE = 'face_embeddings:process'
    private readonly COMPARE_QUEUE = 'face_embeddings:compare'

    constructor(private readonly redisService: RedisService) {}

    async addProcessJob(imageUrl: string, id: string) {
        await this.redisService.rPush(
            this.PROCESS_QUEUE,
            JSON.stringify({ imageUrl, id }),
        )
    }

    async addCompareJob(
        jobId: string, // match id
        storedIds: string[], // stored photos ids in format - "albumId/photoId"[]
        selfie: string, // base64
        threshold = 0.5,
    ) {
        await this.redisService.rPush(
            this.COMPARE_QUEUE,
            JSON.stringify({ jobId, storedIds, selfie, threshold }),
        )
    }
}
