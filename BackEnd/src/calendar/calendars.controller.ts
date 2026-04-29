import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
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
        return this.calendarService.updateCalendarVisible(calendarId, dto);
    }

    /**
     * @public
     * @param calendarId Calendar id to update.
     * @param dto Default color update payload.
     * @returns Updated calendar.
     */
    @Patch(":id/color")
    updateCalendarColor(@Param("id") calendarId: string, @Body() dto: UpdateCalendarColorDto) {
        return this.calendarService.updateCalendarColor(calendarId, dto);
    }
}
