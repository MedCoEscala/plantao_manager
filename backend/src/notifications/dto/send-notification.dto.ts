import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Título da notificação é obrigatório' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Corpo da notificação é obrigatório' })
  body: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
