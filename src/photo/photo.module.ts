import { Module } from '@nestjs/common'

import { PhotoService } from '@/photo/photo.service'
import { PhotoController } from '@/photo/photo.controller'

@Module({
    providers: [PhotoService],
    controllers: [PhotoController],
})
export class PhotoModule {}
