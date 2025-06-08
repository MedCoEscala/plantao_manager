import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { DeviceToken, NotificationConfig } from '@prisma/client';
import { Request } from 'express';

import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  async registerDeviceToken(
    @Body() registerTokenDto: RegisterDeviceTokenDto,
    @Req() req: RequestWithUserContext,
  ): Promise<DeviceToken> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Registrando token de dispositivo para usuário: ${clerkId}`,
    );
    return this.notificationsService.registerDeviceToken(
      clerkId,
      registerTokenDto,
    );
  }

  @Get('device-tokens')
  async getUserDeviceTokens(
    @Req() req: RequestWithUserContext,
  ): Promise<DeviceToken[]> {
    const clerkId = req.userContext.sub;
    return this.notificationsService.getUserDeviceTokens(clerkId);
  }

  @Delete('device-token/:token')
  async removeDeviceToken(
    @Param('token') token: string,
    @Req() req: RequestWithUserContext,
  ): Promise<void> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Removendo token de dispositivo para usuário: ${clerkId}`);
    return this.notificationsService.removeDeviceToken(clerkId, token);
  }

  @Get('config')
  async getNotificationConfig(
    @Req() req: RequestWithUserContext,
  ): Promise<NotificationConfig> {
    const clerkId = req.userContext.sub;
    return this.notificationsService.getNotificationConfig(clerkId);
  }

  @Put('config')
  async updateNotificationConfig(
    @Body() updateConfigDto: UpdateNotificationConfigDto,
    @Req() req: RequestWithUserContext,
  ): Promise<NotificationConfig> {
    const clerkId = req.userContext.sub;
    this.logger.log(
      `Atualizando configuração de notificações para usuário: ${clerkId}`,
    );
    return this.notificationsService.updateNotificationConfig(
      clerkId,
      updateConfigDto,
    );
  }

  @Post('send')
  async sendNotification(
    @Body() notificationDto: SendNotificationDto,
    @Req() req: RequestWithUserContext,
  ): Promise<{ message: string }> {
    const clerkId = req.userContext.sub;
    this.logger.log(`Enviando notificação manual para usuário: ${clerkId}`);
    await this.notificationsService.sendNotificationToUser(
      clerkId,
      notificationDto,
    );
    return { message: 'Notificação enviada com sucesso' };
  }
}
