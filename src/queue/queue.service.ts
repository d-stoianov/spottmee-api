import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType

    private readonly PROCESS_QUEUE = 'face_embeddings:process'
    private readonly COMPARE_QUEUE = 'face_embeddings:compare'

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        })
    }

    async onModuleInit() {
        await this.client.connect()
    }

    async onModuleDestroy() {
        await this.client.quit()
    }

    async addProcessJob(imageUrl: string, id: string) {
        await this.client.rPush(
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
        await this.client.rPush(
            this.COMPARE_QUEUE,
            JSON.stringify({ jobId, storedIds, selfie, threshold }),
        )
    }
}
