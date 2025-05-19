import { Type } from 'class-transformer';
import {
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

export class UpdateShiftDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 08:00)',
  })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 14:00)',
  })
  endTime?: string;

  @IsNumber()
  @Min(0, { message: 'O valor não pode ser negativo' })
  @Type(() => Number)
  @IsOptional()
  value?: number;

  @IsEnum(PaymentType, {
    message: 'Tipo de pagamento deve ser PF ou PJ',
  })
  @IsOptional()
  paymentType?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isFixed?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  contractorId?: string;
}
