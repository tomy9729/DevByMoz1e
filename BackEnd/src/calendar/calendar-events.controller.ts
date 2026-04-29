import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import {
    CreateCalendarEventDto,
    QueryCalendarEventsDto,
    UpdateCalendarEventDto,
} from "./dto/calendar-event.dto";

@Controller("api/calendar/events")
export class CalendarEventsController {
    constructor(private readonly calendarService: CalendarService) {}

    /**
     * @public
     * @param query Period query.
     * @returns Visible calendar events.
     */
    @Get()
    getCalendarEvents(@Query() query: QueryCalendarEventsDto) {
        return this.calendarService.getCalendarEvents(query);
    }

    /**
     * @public
     * @param dto User event creation payload.
     * @returns Created user event.
     */
    @Post()
    createUserEvent(@Body() dto: CreateCalendarEventDto) {
        return this.calendarService.createUserEvent(dto);
    }

    /**
     * @public
     * @param eventId User event id.
     * @param dto User event update payload.
     * @returns Updated user event.
     */
    @Patch(":id")
    updateUserEvent(@Param("id") eventId: string, @Body() dto: UpdateCalendarEventDto) {
        return this.calendarService.updateUserEvent(eventId, dto);
    }

    /**
     * @public
     * @param eventId User event id.
     * @returns Deleted user event id.
     */
    @Delete(":id")
    deleteUserEvent(@Param("id") eventId: string) {
        return this.calendarService.deleteUserEvent(eventId);
    }
}
