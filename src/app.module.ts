import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from '@/prisma/prisma.module'
import { FirebaseModule } from '@/firebase/firebase.module'
import { AuthModule } from '@/auth/auth.module'
import { UserModule } from '@/user/user.module'
import { AlbumModule } from '@/album/album.module'
import { PhotoModule } from '@/photo/photo.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        FirebaseModule,
        AuthModule,
        UserModule,
        AlbumModule,
        PhotoModule,
    ],
})
export class AppModule {}
