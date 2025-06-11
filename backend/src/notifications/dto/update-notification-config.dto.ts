import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class UpdateNotificationConfigDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  dailyReminder?: boolean;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 08:00)',
  })
  dailyReminderTime?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  beforeShiftReminder?: boolean;

  @IsInt()
  @IsOptional()
  @Min(5, { message: 'O lembrete deve ser de pelo menos 5 minutos antes' })
  @Max(1440, { message: 'O lembrete não pode ser mais de 24 horas antes' })
  @Type(() => Number)
  beforeShiftMinutes?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  weeklyReport?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1, { message: 'Dia da semana deve ser entre 1 (segunda) e 7 (domingo)' })
  @Max(7, { message: 'Dia da semana deve ser entre 1 (segunda) e 7 (domingo)' })
  @Type(() => Number)
  weeklyReportDay?: number;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 09:00)',
  })
  weeklyReportTime?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  monthlyReport?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1, { message: 'Dia do mês deve ser entre 1 e 31' })
  @Max(31, { message: 'Dia do mês deve ser entre 1 e 31' })
  @Type(() => Number)
  monthlyReportDay?: number;

  @IsString()
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de horário inválido. Use HH:MM (ex: 09:00)',
  })
  monthlyReportTime?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  shiftConfirmation?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  paymentReminder?: boolean;
}
