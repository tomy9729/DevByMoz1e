import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CalendarEventsController } from "./calendar-events.controller";
import { CalendarService } from "./calendar.service";
import { CalendarsController } from "./calendars.controller";
import { SchedulesController } from "./schedules.controller";

@Module({
    imports: [PrismaModule],
    controllers: [CalendarsController, CalendarEventsController, SchedulesController],
    providers: [CalendarService],
})
export class CalendarModule {}
