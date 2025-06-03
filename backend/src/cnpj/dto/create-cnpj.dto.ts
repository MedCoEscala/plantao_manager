import {
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  IsPositive,
} from 'class-validator';

export class CreateCNPJDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, {
    message:
      'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX ou apenas números (14 dígitos)',
  })
  cnpjNumber?: string;

  @IsOptional()
  @IsString()
  accountingFirmName?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'O valor da mensalidade deve ser positivo' })
  monthlyFee?: number;
}
