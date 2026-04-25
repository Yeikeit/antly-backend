import { IsUUID, IsNumber, IsEnum, IsDateString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
    @IsUUID() budgetId: string;
    @IsUUID() categoryId: string;
    @IsEnum(['EXPENSE', 'INCOME', 'SAVING']) type: 'EXPENSE' | 'INCOME' | 'SAVING';
    @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
    @IsDateString() transactionDate: string;
    @IsOptional() @IsString() description?: string;
}

export class UpdateTransactionDto {
    @IsOptional() @IsUUID() categoryId?: string;
    @IsOptional() @IsEnum(['EXPENSE', 'INCOME', 'SAVING']) type?: 'EXPENSE' | 'INCOME' | 'SAVING';
    @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;
    @IsOptional() @IsDateString() transactionDate?: string;
    @IsOptional() @IsString() description?: string;
}
