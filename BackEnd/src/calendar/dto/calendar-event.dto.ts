import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsOptional, IsString } from "class-validator";

export class QueryCalendarEventsDto {
    @IsString()
    from!: string;

    @IsString()
    to!: string;
}

export class CreateCalendarEventDto {
    @IsString()
    calendarId!: string;

    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Date)
    @IsDate()
    startDateTime!: Date;

    @Type(() => Date)
    @IsDate()
    endDateTime!: Date;

    @IsOptional()
    @IsBoolean()
    allDay?: boolean;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    recurrenceRule?: string;

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
    @Type(() => Date)
    @IsDate()
    startDateTime?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDateTime?: Date;

    @IsOptional()
    @IsBoolean()
    allDay?: boolean;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    recurrenceRule?: string;

    @IsOptional()
    @IsBoolean()
    alarmEnabled?: boolean;
}
