import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do local é obrigatório' })
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  phone?: number;

  @IsString()
  @IsNotEmpty({ message: 'A cor é obrigatória' })
  color: string;
}
