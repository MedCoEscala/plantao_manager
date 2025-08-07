import { Type } from 'class-transformer';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class GetShiftTemplatesFilterDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  contractorId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
