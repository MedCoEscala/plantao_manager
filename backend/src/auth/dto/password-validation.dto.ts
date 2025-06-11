import {
  IsString,
  IsNotEmpty,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

import { validatePassword } from '../utils/password-validation';

@ValidatorConstraint({ name: 'isValidPassword', async: false })
export class IsValidPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: any, args: ValidationArguments) {
    if (typeof password !== 'string') {
      return false;
    }
    const result = validatePassword(password);
    return result.isValid;
  }

  defaultMessage(args: ValidationArguments) {
    if (typeof args.value !== 'string') {
      return 'Senha deve ser uma string';
    }
    const result = validatePassword(args.value);
    return result.message || 'Senha inválida';
  }
}

export class PasswordValidationDto {
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @Validate(IsValidPasswordConstraint)
  password: string;
}
