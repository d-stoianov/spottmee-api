import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'

import { AppModule } from '@/app.module'
import { ZodValidationExceptionFilter } from '@/zod-validation.filter'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )

    app.enableCors(process.env.origin ?? '*')
    app.useGlobalFilters(new ZodValidationExceptionFilter())

    await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
