import { IsOptional, IsString } from 'class-validator';

export class GetContractorsFilterDto {
  @IsOptional()
  @IsString()
  searchTerm?: string;
}
