import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';

export class SyncUserDto {
  @IsString()
  @IsNotEmpty({ message: 'userId é obrigatório' })
  userId: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsOptional()
  @IsString()
  // Adicione validações mais específicas para telefone se necessário
  phoneNumber?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Formato de data de nascimento inválido. Use YYYY-MM-DD.',
  })
  birthDate?: string; // Recebe como string YYYY-MM-DD
}
