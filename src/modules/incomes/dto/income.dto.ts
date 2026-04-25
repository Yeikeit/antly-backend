import { IsUUID, IsNumber, IsDateString, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncomeDto {
    @IsUUID() incomeSourceId: string;
    @IsUUID() budgetId: string;
    @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount: number;
    @IsDateString() receivedDate: string;
    @IsOptional() @IsString() description?: string;
}

export class UpdateIncomeDto {
    @IsOptional() @IsUUID() incomeSourceId?: string;
    @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount?: number;
    @IsOptional() @IsDateString() receivedDate?: string;
    @IsOptional() @IsString() description?: string;
}
