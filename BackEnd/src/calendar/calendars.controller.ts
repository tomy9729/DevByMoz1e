import { Body, Controller, Get, MethodNotAllowedException, Param, Patch } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { UpdateCalendarColorDto, UpdateCalendarVisibleDto } from "./dto/update-calendar.dto";

@Controller("api/calendars")
export class CalendarsController {
    constructor(private readonly calendarService: CalendarService) {}

    /**
     * @public
     * @returns Calendar list.
     */
    @Get()
    getCalendars() {
        return this.calendarService.getCalendars();
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Visibility update payload.
     * @returns Updated calendar.
     */
    @Patch(":id/visible")
    updateCalendarVisible(@Param("id") calendarId: string, @Body() dto: UpdateCalendarVisibleDto) {
        throw new MethodNotAllowedException("Calendar updates are disabled.");
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Default color update payload.
     * @returns Updated calendar.
     */
    @Patch(":id/color")
    updateCalendarColor(@Param("id") calendarId: string, @Body() dto: UpdateCalendarColorDto) {
        throw new MethodNotAllowedException("Calendar updates are disabled.");
    }
}
