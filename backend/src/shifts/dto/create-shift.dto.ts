import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  Min,
  Matches,
} from 'class-validator';

enum PaymentType {
  PF = 'PF',
  PJ = 'PJ',
}

export class CreateShiftDto {
  @IsDateString()
  @IsNotEmpty({ message: 'A data do plantão é obrigatória' })
  date: string;

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

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isFixed: boolean = false;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  contractorId?: string;
}
