import { Type } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsArray } from 'class-validator';

export class GetShiftsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  @Type(() => String)
  status?: string[];

  @IsOptional()
  @IsString()
  searchTerm?: string;
}
