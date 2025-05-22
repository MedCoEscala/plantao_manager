import { IsOptional, IsString, IsDateString } from 'class-validator';
export class GetPaymentsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}
