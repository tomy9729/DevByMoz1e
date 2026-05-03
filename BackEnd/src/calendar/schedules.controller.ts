import { Controller, Get, Query } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { QuerySchedulesDto } from "./dto/query-schedules.dto";

@Controller("api/schedules")
export class SchedulesController {
    constructor(private readonly calendarService: CalendarService) {}
    @Get()
    getSchedules(@Query() query: QuerySchedulesDto) {
        return this.calendarService.getSchedules(query.startDate, query.endDate);
    }
}
