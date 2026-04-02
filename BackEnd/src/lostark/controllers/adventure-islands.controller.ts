import { Controller, Delete, Get, Post, Query } from "@nestjs/common";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { AdventureIslandsService } from "../services/adventure-islands.service";

@Controller("api/lostark/adventure-islands")
export class AdventureIslandsController {
    constructor(private readonly adventureIslandsService: AdventureIslandsService) {}

    @Post("collect")
    async collectAdventureIslands() {
        return this.adventureIslandsService.collectAdventureIslands();
    }

    @Post("test-note/import")
    async importAdventureIslandTestNoteData() {
        return this.adventureIslandsService.importAdventureIslandTestNoteData();
    }

    @Get("test-note")
    async getAdventureIslandTestNoteData(@Query() query: QueryAdventureIslandsDto) {
        return this.adventureIslandsService.getAdventureIslandTestNoteData(query);
    }

    @Delete("test-note")
    async deleteAdventureIslandTestNoteData() {
        return this.adventureIslandsService.deleteAdventureIslandTestNoteData();
    }

    @Get("resolved")
    async getAdventureIslandsFromDatabaseFirst(@Query() query: QueryAdventureIslandsDto) {
        return this.adventureIslandsService.getAdventureIslandsFromDatabaseFirst(query);
    }

    @Get()
    async getAdventureIslands(@Query() query: QueryAdventureIslandsDto) {
        return this.adventureIslandsService.getAdventureIslandsFromDatabaseFirst(query);
    }
}
