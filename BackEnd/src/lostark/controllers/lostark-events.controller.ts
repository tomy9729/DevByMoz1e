import { Controller, Get } from "@nestjs/common";
import { LostArkEventsService } from "../services/lostark-events.service";

@Controller("api/lostark/news")
export class LostArkEventsController {
    constructor(private readonly lostArkEventsService: LostArkEventsService) {}

    @Get("events")
    async getEvents() {
        return this.lostArkEventsService.getEvents();
    }
}
