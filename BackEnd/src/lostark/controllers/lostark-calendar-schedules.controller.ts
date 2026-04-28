import { Controller, Get, Query } from "@nestjs/common";
import { QueryCalendarSchedulesDto } from "../dto/query-calendar-schedules.dto";
import { LostArkCalendarSchedulesService } from "../services/lostark-calendar-schedules.service";

@Controller("api/lostark/calendar/schedules")
export class LostArkCalendarSchedulesController {
    constructor(
        private readonly lostArkCalendarSchedulesService: LostArkCalendarSchedulesService,
    ) {}

    @Get()
    async getMonthlySchedules(@Query() query: QueryCalendarSchedulesDto) {
        return this.lostArkCalendarSchedulesService.getMonthlySchedules(query);
    }
}
