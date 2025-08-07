import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  Matches,
  MaxLength,
} from 'class-validator';

enum PaymentType {
  PF = 'PF',
  PJ = 'PJ',
}

export class CreateShiftTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do modelo é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Horário de início é obrigatório' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 08:00)',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty({ message: 'Horário de término é obrigatório' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 14:00)',
  })
  endTime: string;

  @IsNumber()
  @Min(0, { message: 'O valor não pode ser negativo' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'O valor do plantão é obrigatório' })
  value: number;

  @IsEnum(PaymentType, {
    message: 'Tipo de pagamento deve ser PF ou PJ',
  })
  @IsNotEmpty({ message: 'O tipo de pagamento é obrigatório' })
  paymentType: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, {
    message: 'Observações devem ter no máximo 1000 caracteres',
  })
  notes?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean = true;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  contractorId?: string;
}
