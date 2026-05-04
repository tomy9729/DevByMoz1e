import { Controller, Delete, Get, MethodNotAllowedException, Post, Query } from "@nestjs/common";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { AdventureIslandsService } from "../services/adventure-islands.service";

@Controller("api/lostark/adventure-islands")
export class AdventureIslandsController {
    constructor(private readonly adventureIslandsService: AdventureIslandsService) {}

    @Post("collect")
    async collectAdventureIslands() {
        throw new MethodNotAllowedException("Adventure island collection is disabled.");
    }

    @Post("test-note/import")
    async importAdventureIslandTestNoteData() {
        throw new MethodNotAllowedException("Adventure island test note import is disabled.");
    }

    @Get("test-note")
    async getAdventureIslandTestNoteData(@Query() query: QueryAdventureIslandsDto) {
        return this.adventureIslandsService.getAdventureIslandTestNoteData(query);
    }

    @Delete("test-note")
    async deleteAdventureIslandTestNoteData() {
        throw new MethodNotAllowedException("Adventure island test note deletion is disabled.");
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
