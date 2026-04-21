import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BotModule } from "./bot/bot.module";
import { LostArkModule } from "./lostark/lostark.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [".env.local", ".env"],
        }),
        BotModule,
        PrismaModule,
        LostArkModule,
    ],
})
export class AppModule {}
