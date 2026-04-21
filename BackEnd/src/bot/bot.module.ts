import { Module } from "@nestjs/common";
import { LostArkModule } from "../lostark/lostark.module";
import { BotAlarmController } from "./bot-alarm.controller";
import { BotAlarmService } from "./bot-alarm.service";
import { BotCommandController } from "./bot-command.controller";
import { BotCommandService } from "./bot-command.service";

@Module({
    imports: [LostArkModule],
    controllers: [BotCommandController, BotAlarmController],
    providers: [BotCommandService, BotAlarmService],
})
export class BotModule {}
