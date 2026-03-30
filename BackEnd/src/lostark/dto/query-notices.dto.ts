import { IsOptional, IsString } from "class-validator";

export class QueryNoticesDto {
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    fromDate?: string;

    @IsOptional()
    @IsString()
    toDate?: string;
}
