import { IsString } from "class-validator";

export class QuerySchedulesDto {
    @IsString()
    startDate!: string;

    @IsString()
    endDate!: string;
}
