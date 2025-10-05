import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'

import { AppModule } from '@/app.module'
import { ZodValidationExceptionFilter } from '@/zod-validation.filter'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )

    app.enableCors({
        origin: ['https://app.spottmee.com', 'http://localhost:5173'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    })
    app.useGlobalFilters(new ZodValidationExceptionFilter())

    await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
