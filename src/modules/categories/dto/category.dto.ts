import {
    IsString, IsEnum, IsOptional, IsUUID,
    IsBoolean, IsInt, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsEnum(['EXPENSE', 'SAVING', 'INCOME'])
    type: 'EXPENSE' | 'SAVING' | 'INCOME';

    // Si viene parentId → nivel 2 (subcategoría), si no → nivel 1
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    sortOrder?: number;
}

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    sortOrder?: number;
}
