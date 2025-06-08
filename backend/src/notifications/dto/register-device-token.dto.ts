import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Token do dispositivo é obrigatório' })
  token: string;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsOptional()
  deviceType?: string; // "ios" | "android"

  @IsString()
  @IsOptional()
  appVersion?: string;
}
