import { IsString, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class UpdatePaymentDto {
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  method?: string;
}
