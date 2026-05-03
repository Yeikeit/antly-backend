import { IsUUID, IsNumber, IsEnum, IsDateString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
    @ApiProperty({ description: 'UUID de la categoría' })
    @IsUUID() categoryId: string;

    @ApiProperty({ enum: ['EXPENSE', 'INCOME', 'SAVING'] })
    @IsEnum(['EXPENSE', 'INCOME', 'SAVING']) type: 'EXPENSE' | 'INCOME' | 'SAVING';

    @ApiProperty({ example: 50000, minimum: 0.01 })
    @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;

    @ApiProperty({ example: '2026-04-15' })
    @IsDateString() transactionDate: string;

    @ApiProperty({ required: false })
    @IsOptional() @IsString() description?: string;
}

export class UpdateTransactionDto {
    @ApiProperty({ required: false })
    @IsOptional() @IsUUID() categoryId?: string;

    @ApiProperty({ required: false, enum: ['EXPENSE', 'INCOME', 'SAVING'] })
    @IsOptional() @IsEnum(['EXPENSE', 'INCOME', 'SAVING']) type?: 'EXPENSE' | 'INCOME' | 'SAVING';

    @ApiProperty({ required: false, minimum: 0.01 })
    @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;

    @ApiProperty({ required: false, example: '2026-04-15' })
    @IsOptional() @IsDateString() transactionDate?: string;

    @ApiProperty({ required: false })
    @IsOptional() @IsString() description?: string;
}
