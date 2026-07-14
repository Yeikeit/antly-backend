import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
export const PASSWORD_MESSAGE = 'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número';

export function PasswordField() {
  return function (target: object, key: string) {
    IsString()(target, key);
    MinLength(8)(target, key);
    MaxLength(100)(target, key);
    Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })(target, key);
  };
}
