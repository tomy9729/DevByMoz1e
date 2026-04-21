import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "127.0.0.1";
    const corsOrigins = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin && origin !== "*");

    app.enableCors({
        origin: corsOrigins.length > 0 ? corsOrigins : false,
    });
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    );

    await app.listen(port, host);
}

bootstrap();
