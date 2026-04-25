import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateIncomeSourceDto {
    @IsString() @MaxLength(100) name: string;
}

export class UpdateIncomeSourceDto {
    @IsOptional() @IsString() @MaxLength(100) name?: string;
    @IsOptional() @IsBoolean() isActive?: boolean;
}
