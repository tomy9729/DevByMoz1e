import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST;
    const corsOrigins = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.enableCors(
        corsOrigins.length > 0
            ? {
                  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
              }
            : true,
    );
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    );

    if (host) {
        await app.listen(port, host);
        return;
    }

    await app.listen(port);
}

bootstrap();
