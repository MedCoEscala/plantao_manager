import { IsNotEmpty, IsDateString, IsString } from 'class-validator';

export class CreateShiftFromTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do modelo é obrigatório' })
  templateId: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Data do plantão é obrigatória' })
  date: string;
}
