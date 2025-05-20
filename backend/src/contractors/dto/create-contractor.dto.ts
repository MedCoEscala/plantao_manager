import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateContractorDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do contratante é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
