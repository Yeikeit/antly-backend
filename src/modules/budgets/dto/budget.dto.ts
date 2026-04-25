import { IsInt, IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
    @Type(() => Number) @IsInt() @Min(2020) year: number;
    @Type(() => Number) @IsInt() @Min(1) @Max(12) month: number;
    @IsOptional() @IsString() notes?: string;
}

export class UpdateBudgetStatusDto {
    @IsEnum(['DRAFT', 'ACTIVE', 'CLOSED']) status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
}

export class UpdateBudgetNotesDto {
    @IsString() notes: string;
}

export class UpsertAllocationDto {
    @IsUUID() categoryId: string;
    @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) allocatedAmount: number;
}
