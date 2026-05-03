import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsOptional, IsString, ValidateNested } from "class-validator";

export class QueryCalendarEventsDto {
    @IsString()
    from!: string;

    @IsString()
    to!: string;
}

export class CalendarEventTimeDto {
    @Type(() => Date)
    @IsDate()
    startDateTime!: Date;

    @Type(() => Date)
    @IsDate()
    endDateTime!: Date;

    @IsOptional()
    @IsBoolean()
    allDay?: boolean;
}

export class CreateCalendarEventDto {
    @IsString()
    calendarId!: string;

    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CalendarEventTimeDto)
    times!: CalendarEventTimeDto[];

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsBoolean()
    alarmEnabled?: boolean;
}

export class UpdateCalendarEventDto {
    @IsOptional()
    @IsString()
    calendarId?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CalendarEventTimeDto)
    times?: CalendarEventTimeDto[];

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsBoolean()
    alarmEnabled?: boolean;
}
