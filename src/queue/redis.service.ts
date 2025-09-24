import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly client: RedisClientType

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        })
    }

    async onModuleInit() {
        await this.client.connect()

        console.log('Connected to Redis: ', this.client.options?.url)
    }

    async onModuleDestroy() {
        await this.client.quit()
    }

    getClient(): RedisClientType {
        return this.client
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key)
    }

    async set(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds) {
            await this.client.set(key, value, { EX: ttlSeconds })
        } else {
            await this.client.set(key, value)
        }
    }

    async del(key: string) {
        await this.client.del(key)
    }

    async rPush(key: string, value: string) {
        await this.client.rPush(key, value)
    }

    async lPop(key: string): Promise<string | null> {
        return this.client.lPop(key)
    }
}
