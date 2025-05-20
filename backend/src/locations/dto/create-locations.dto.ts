import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do local é obrigatório' })
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsNumber()
  @IsNotEmpty()
  phone: number;

  @IsString()
  @IsNotEmpty({ message: 'A cor é obrigatória' })
  color: string;
}
