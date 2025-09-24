import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType

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
}
