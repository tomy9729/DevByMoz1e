import { IsBoolean, IsString } from "class-validator";

export class UpdateCalendarVisibleDto {
    @IsBoolean()
    isVisible!: boolean;
}

export class UpdateCalendarColorDto {
    @IsString()
    defaultColor!: string;
}
