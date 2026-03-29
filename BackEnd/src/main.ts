import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const frontendOrigin = process.env.FRONTEND_ORIGIN;

    app.enableCors(
        frontendOrigin
            ? {
                  origin: frontendOrigin,
              }
            : true,
    );
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    );

    await app.listen(Number(process.env.PORT) || 3000);
}

bootstrap();
