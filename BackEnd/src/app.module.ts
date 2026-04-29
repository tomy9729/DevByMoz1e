import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BotModule } from "./bot/bot.module";
import { CalendarModule } from "./calendar/calendar.module";
import { LostArkModule } from "./lostark/lostark.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [".env.local", ".env"],
        }),
        BotModule,
        CalendarModule,
        PrismaModule,
        LostArkModule,
    ],
})
export class AppModule {}
