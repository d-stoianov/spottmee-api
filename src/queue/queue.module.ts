import { Global, Module } from '@nestjs/common'
import { QueueService } from './queue.service'
import { RedisService } from '@/queue/redis.service'

@Global()
@Module({
    providers: [QueueService, RedisService],
    exports: [QueueService, RedisService],
})
export class QueueModule {}
