import {
    IsString, IsEmail, IsOptional, IsBoolean,
    MinLength, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiProperty({ required: false, maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @ApiProperty({ required: false, maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @ApiProperty({ required: false, example: 'nuevo@ejemplo.com' })
    @IsOptional()
    @IsEmail()
    email?: string;
}

export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    currentPassword: string;

    @ApiProperty({ minLength: 8, description: 'Debe contener mayúscula, minúscula y número' })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'Contraseña debe contener al menos una letra mayúscula, una letra minúscula y un número',
    })
    newPassword: string;
}

export class UpdatePreferencesDto {
    @ApiProperty({ required: false, description: 'Activar/desactivar automatización de presupuesto mensual' })
    @IsOptional()
    @IsBoolean()
    budgetAutomation?: boolean;
}

