import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'
import { ZodError } from 'zod'

@Catch(ZodError)
export class ZodValidationExceptionFilter implements ExceptionFilter {
    catch(exception: ZodError, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        const messages = exception.issues.map((issue) => issue.message)

        response.status(400).json({
            statusCode: 400,
            message: messages,
            error: 'Bad Request',
        })
    }
}
