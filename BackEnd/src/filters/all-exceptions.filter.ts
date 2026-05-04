import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common"
import type { Response } from "express"

/**
 * NestJS 기본 필터는 HttpException이 아닌 Error의 message를 응답에 포함하지 않는다.
 * 이 필터는 Error.message를 직접 클라이언트에 전달하기 위해 전역으로 등록한다.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name)

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()

        if (exception instanceof HttpException) {
            response.status(exception.getStatus()).json(exception.getResponse())
            return
        }

        const message =
            exception instanceof Error
                ? exception.message
                : "Internal server error"

        this.logger.error(
            "Unhandled exception",
            exception instanceof Error ? exception.stack : String(exception),
        )

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message,
        })
    }
}
