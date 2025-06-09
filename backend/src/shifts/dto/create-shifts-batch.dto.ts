import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  Matches,
} from 'class-validator';

enum PaymentType {
  PF = 'PF',
  PJ = 'PJ',
}

export class CreateShiftBatchItemDto {
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

export class CreateShiftsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShiftBatchItemDto)
  @IsNotEmpty({ message: 'Pelo menos um plantão deve ser informado' })
  shifts: CreateShiftBatchItemDto[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  skipConflicts?: boolean; // Pular plantões que já existem nas mesmas datas/horários

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  continueOnError?: boolean; // Continuar criando outros plantões se um falhar
}
