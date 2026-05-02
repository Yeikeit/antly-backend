import {
    IsString, IsEnum, IsOptional, IsUUID,
    IsBoolean, IsInt, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../entities/category.entity';

export class CategoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: ['EXPENSE', 'SAVING', 'INCOME'] })
    type: CategoryType;

    @ApiProperty()
    sortOrder: number;
}

export class CategoryTreeDto extends CategoryResponseDto {
    @ApiProperty({ type: [CategoryResponseDto] })
    subcategories: CategoryResponseDto[];
}

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
