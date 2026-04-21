import { Controller, Get, Header } from "@nestjs/common";
import { BotCommandService } from "./bot-command.service";

@Controller("api/bot")
export class BotCommandController {
    constructor(private readonly botCommandService: BotCommandService) {}

    @Get("commands")
    @Header("Content-Type", "text/plain; charset=utf-8")
    getCommandListMessage() {
        return this.botCommandService.getCommandListMessage();
    }

    @Get("adventure-islands")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async getAdventureIslandsMessage() {
        return this.botCommandService.getAdventureIslandsMessage();
    }
}
