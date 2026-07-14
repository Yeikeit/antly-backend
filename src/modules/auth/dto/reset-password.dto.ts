import { IsString } from 'class-validator';
import { PasswordField } from '../../../common/validators/password.validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @PasswordField()
  newPassword: string;
}
