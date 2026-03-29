import { Controller, Get } from "@nestjs/common";
import { LostArkGameContentsService } from "../services/lostark-game-contents.service";

@Controller("api/lostark/gamecontents")
export class LostArkGameContentsController {
    constructor(
        private readonly lostArkGameContentsService: LostArkGameContentsService,
    ) {}

    @Get("calendar")
    async getCalendarContents() {
        return this.lostArkGameContentsService.getCalendarContents();
    }
}
