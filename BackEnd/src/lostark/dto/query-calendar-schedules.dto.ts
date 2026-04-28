import { Transform } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class QueryCalendarSchedulesDto {
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(2000)
    year!: number;

    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(12)
    month!: number;
}
