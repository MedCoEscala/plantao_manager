import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateContractorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
