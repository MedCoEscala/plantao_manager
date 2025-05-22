import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do plantão é obrigatório' })
  plantaoId: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsBoolean()
  @IsNotEmpty({ message: 'Status de pagamento é obrigatório' })
  paid: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  method?: string;
}
