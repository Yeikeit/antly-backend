import {
    IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID,
    IsBoolean, IsInt, Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { CategoryType, SourceType } from '../entities/category.entity';

export class CategoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: ['EXPENSE', 'SAVING', 'INCOME'] })
    type: CategoryType;

    @ApiProperty({ enum: ['DEFAULT', 'CUSTOM'] })
    sourceType: SourceType;

    @ApiProperty()
    sortOrder: number;
}

export class CategoryTreeDto extends CategoryResponseDto {
    @ApiProperty({ type: [CategoryResponseDto] })
    subcategories: CategoryResponseDto[];
}

export class CreateCategoryDto {
    @ApiProperty({ example: 'Alimentación', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @ApiProperty({ enum: ['EXPENSE', 'SAVING', 'INCOME'] })
    @IsEnum(['EXPENSE', 'SAVING', 'INCOME'])
    type: 'EXPENSE' | 'SAVING' | 'INCOME';

    @ApiProperty({ description: 'UUID de la categoría padre (omitir para nivel 1)', required: false })
    @IsOptional()
    @IsUUID()
    parentId?: string;

    @ApiProperty({ required: false, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    sortOrder?: number;
}

export class UpdateCategoryDto {
    @ApiProperty({ required: false, maxLength: 100 })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    sortOrder?: number;
}
