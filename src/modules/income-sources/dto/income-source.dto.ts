import { IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncomeSourceDto {
    @ApiProperty({ example: 'Salario', maxLength: 100 })
    @IsString() @MaxLength(100) name: string;
}

export class UpdateIncomeSourceDto {
    @ApiProperty({ required: false, maxLength: 100 })
    @IsOptional() @IsString() @MaxLength(100) name?: string;

    @ApiProperty({ required: false })
    @IsOptional() @IsBoolean() isActive?: boolean;
}
