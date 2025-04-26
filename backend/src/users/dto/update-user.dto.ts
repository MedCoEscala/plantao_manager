import { IsString, IsOptional, Matches, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nome não pode ser vazio se fornecido' })
  name?: string;

  @IsOptional()
  @IsString() // Permite string vazia para remover o número
  // Adicione validações mais específicas para telefone se necessário
  phoneNumber?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Formato de data de nascimento inválido. Use YYYY-MM-DD.',
  })
  birthDate?: string; // Recebe como string YYYY-MM-DD ou vazio/null para remover
}
