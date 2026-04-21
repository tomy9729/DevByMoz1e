import { Module } from "@nestjs/common";
import { LostArkModule } from "../lostark/lostark.module";
import { BotCommandController } from "./bot-command.controller";
import { BotCommandService } from "./bot-command.service";

@Module({
    imports: [LostArkModule],
    controllers: [BotCommandController],
    providers: [BotCommandService],
})
export class BotModule {}
