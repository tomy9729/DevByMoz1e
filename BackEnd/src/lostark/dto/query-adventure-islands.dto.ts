import { AdventureIslandPeriod } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class QueryAdventureIslandsDto {
    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;

    @IsOptional()
    @IsEnum(AdventureIslandPeriod)
    period?: AdventureIslandPeriod;
}
