import { Controller, Get, Header, Query } from "@nestjs/common";
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
    async getAdventureIslandsMessage(@Query("query") query?: string) {
        return this.botCommandService.getAdventureIslandsMessage(query);
    }

    @Get("characters")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async getCharacterMessage(@Query("name") name?: string, @Query("section") section?: string) {
        return this.botCommandService.getCharacterMessage(name, section);
    }

    @Get("characters/refresh")
    @Header("Content-Type", "text/plain; charset=utf-8")
    async refreshCharacterMessage(@Query("name") name?: string) {
        return this.botCommandService.refreshCharacterMessage(name);
    }
}
