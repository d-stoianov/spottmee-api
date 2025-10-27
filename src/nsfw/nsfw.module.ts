import { Global, Module } from '@nestjs/common'
import { NsfwService } from '@/nsfw/nsfw.service'

@Global()
@Module({
    providers: [NsfwService],
    exports: [NsfwService],
})
export class NsfwModule {}
