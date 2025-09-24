import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from '@/prisma/prisma.module'
import { FirebaseModule } from '@/firebase/firebase.module'
import { AuthModule } from '@/auth/auth.module'
import { UserModule } from '@/user/user.module'
import { AlbumModule } from '@/album/album.module'
import { PhotoModule } from '@/photo/photo.module'
import { MatchAlbumModule } from '@/match-album/match-album.module'
import { QueueModule } from '@/queue/queue.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        FirebaseModule,
        QueueModule,
        AuthModule,
        UserModule,
        AlbumModule,
        MatchAlbumModule,
        PhotoModule,
    ],
})
export class AppModule {}
