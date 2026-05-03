import { IsUUID, IsNumber, IsDateString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncomeDto {
    @ApiProperty({ description: 'UUID de la fuente de ingreso' })
    @IsUUID() incomeSourceId: string;

    @ApiProperty({ description: 'UUID del presupuesto' })
    @IsUUID() budgetId: string;

    @ApiProperty({ example: 1500000, minimum: 0.01 })
    @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;

    @ApiProperty({ example: '2026-04-01' })
    @IsDateString() receivedDate: string;

    @ApiProperty({ required: false })
    @IsOptional() @IsString() description?: string;
}

export class UpdateIncomeDto {
    @ApiProperty({ required: false })
    @IsOptional() @IsUUID() incomeSourceId?: string;

    @ApiProperty({ required: false, minimum: 0.01 })
    @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;

    @ApiProperty({ required: false, example: '2026-04-01' })
    @IsOptional() @IsDateString() receivedDate?: string;

    @ApiProperty({ required: false })
    @IsOptional() @IsString() description?: string;
}
