import { IsOptional, IsString } from 'class-validator';

export class GetLocationsFilterDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;
}
