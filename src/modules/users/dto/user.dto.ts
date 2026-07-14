import { IsString, IsEmail, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordField } from '../../../common/validators/password.validator';

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
    @PasswordField()
    newPassword: string;
}

export class UpdatePreferencesDto {
    @ApiProperty({ required: false, description: 'Activar/desactivar automatización de presupuesto mensual' })
    @IsOptional()
    @IsBoolean()
    budgetAutomation?: boolean;
}

