import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  ValidateIf,
} from 'class-validator';

export class CreateContractorDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do contratante é obrigatório' })
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
