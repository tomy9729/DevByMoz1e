import { Controller, Get, Post, Query } from "@nestjs/common";
import { QueryAdventureIslandsDto } from "../dto/query-adventure-islands.dto";
import { AdventureIslandsService } from "../services/adventure-islands.service";

@Controller("api/lostark/adventure-islands")
export class AdventureIslandsController {
    constructor(private readonly adventureIslandsService: AdventureIslandsService) {}

    @Post("collect")
    async collectAdventureIslands() {
        return this.adventureIslandsService.collectAdventureIslands();
    }

    @Get()
    async getAdventureIslands(@Query() query: QueryAdventureIslandsDto) {
        return this.adventureIslandsService.getAdventureIslands(query);
    }
}
