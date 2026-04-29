import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CalendarEventsController } from "./calendar-events.controller";
import { CalendarService } from "./calendar.service";
import { CalendarsController } from "./calendars.controller";

@Module({
    imports: [PrismaModule],
    controllers: [CalendarsController, CalendarEventsController],
    providers: [CalendarService],
})
export class CalendarModule {}
