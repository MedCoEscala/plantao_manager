import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceToken, NotificationConfig } from '@prisma/client';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(private prisma: PrismaService) {
    this.expo = new Expo({
      useFcmV1: true, // Usar FCM v1 API (mais moderno)
    });

    this.logger.log('🔔 NotificationsService inicializado com Expo SDK');
  }

  async registerDeviceToken(
    clerkId: string,
    registerTokenDto: RegisterDeviceTokenDto,
  ): Promise<DeviceToken> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      const existingToken = await this.prisma.deviceToken.findUnique({
        where: { token: registerTokenDto.token },
      });

      if (existingToken) {
        return this.prisma.deviceToken.update({
          where: { token: registerTokenDto.token },
          data: {
            userId: user.id,
            deviceName: registerTokenDto.deviceName,
            deviceType: registerTokenDto.deviceType,
            appVersion: registerTokenDto.appVersion,
            isActive: true,
            lastUsedAt: new Date(),
          },
        });
      }

      return this.prisma.deviceToken.create({
        data: {
          userId: user.id,
          token: registerTokenDto.token,
          deviceName: registerTokenDto.deviceName,
          deviceType: registerTokenDto.deviceType,
          appVersion: registerTokenDto.appVersion,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao registrar token do dispositivo: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Erro ao registrar token do dispositivo',
      );
    }
  }

  async getNotificationConfig(clerkId: string): Promise<NotificationConfig> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      let config = await this.prisma.notificationConfig.findUnique({
        where: { userId: user.id },
      });

      if (!config) {
        config = await this.prisma.notificationConfig.create({
          data: {
            userId: user.id,
          },
        });
      }

      return config;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar configuração de notificações: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateNotificationConfig(
    clerkId: string,
    updateConfigDto: UpdateNotificationConfigDto,
  ): Promise<NotificationConfig> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      let config = await this.prisma.notificationConfig.findUnique({
        where: { userId: user.id },
      });

      if (!config) {
        config = await this.prisma.notificationConfig.create({
          data: {
            userId: user.id,
            ...updateConfigDto,
          },
        });
      } else {
        config = await this.prisma.notificationConfig.update({
          where: { userId: user.id },
          data: updateConfigDto,
        });
      }

      return config;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar configuração de notificações: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendNotificationToUser(
    clerkId: string,
    notificationDto: SendNotificationDto,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        include: {
          deviceTokens: {
            where: { isActive: true },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      if (user.deviceTokens.length === 0) {
        this.logger.warn(
          `Usuário ${clerkId} não possui tokens de dispositivo ativos`,
        );
        return;
      }

      const messages: ExpoPushMessage[] = user.deviceTokens.map(
        (deviceToken) => ({
          to: deviceToken.token,
          sound: 'default',
          title: notificationDto.title,
          body: notificationDto.body,
          data: notificationDto.data || {},
        }),
      );

      const chunks = this.expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

          for (let i = 0; i < ticketChunk.length; i++) {
            const ticket = ticketChunk[i];
            const deviceToken = user.deviceTokens[i];

            await this.prisma.notificationLog.create({
              data: {
                userId: user.id,
                deviceToken: deviceToken.token,
                title: notificationDto.title,
                body: notificationDto.body,
                data: notificationDto.data || {},
                type: notificationDto.type || 'manual',
                status: ticket.status === 'ok' ? 'sent' : 'failed',
                sentAt: new Date(),
                failureReason:
                  ticket.status === 'error' ? ticket.message : null,
              },
            });
          }
        } catch (error) {
          this.logger.error(
            `Erro ao enviar chunk de notificações: ${error.message}`,
          );
        }
      }

      this.logger.log(`Notificações enviadas para usuário ${clerkId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar notificação: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Cron('0 8 * * *')
  async sendDailyReminders(): Promise<void> {
    this.logger.log('Iniciando envio de lembretes diários');

    try {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const usersWithConfig = await this.prisma.user.findMany({
        include: {
          notificationConfig: true,
          deviceTokens: {
            where: { isActive: true },
          },
          plantoes: {
            where: {
              date: {
                gte: todayStart,
                lte: todayEnd,
              },
            },
            include: {
              location: true,
            },
            orderBy: {
              startTime: 'asc',
            },
          },
        },
        where: {
          notificationConfig: {
            dailyReminder: true,
          },
          deviceTokens: {
            some: {
              isActive: true,
            },
          },
        },
      });

      for (const user of usersWithConfig) {
        try {
          if (user.plantoes.length === 0) {
            continue;
          }

          const shiftsText = user.plantoes
            .map((plantao) => {
              const startTime = format(plantao.startTime, 'HH:mm');
              const endTime = format(plantao.endTime, 'HH:mm');
              const location = plantao.location?.name || 'Local não informado';
              return `📍 ${location}: ${startTime} - ${endTime}`;
            })
            .join('\n');

          const title = `🏥 Plantões de hoje - ${format(today, 'dd/MM/yyyy')}`;
          const body = `Você tem ${user.plantoes.length} plantão(ões) hoje:\n\n${shiftsText}`;

          await this.sendNotificationToUser(user.clerkId, {
            title,
            body,
            type: 'daily_reminder',
            data: {
              date: format(today, 'yyyy-MM-dd'),
              shiftsCount: user.plantoes.length,
            },
          });
        } catch (error) {
          this.logger.error(
            `Erro ao enviar lembrete diário para usuário ${user.clerkId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Lembretes diários enviados para ${usersWithConfig.length} usuários`,
      );
    } catch (error) {
      this.logger.error(
        `Erro no job de lembretes diários: ${error.message}`,
        error.stack,
      );
    }
  }

  @Cron('0 * * * *')
  async sendBeforeShiftReminders(): Promise<void> {
    this.logger.log('Verificando lembretes antes dos plantões');

    try {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 2);

      const usersWithConfig = await this.prisma.user.findMany({
        include: {
          notificationConfig: true,
          deviceTokens: {
            where: { isActive: true },
          },
          plantoes: {
            where: {
              startTime: {
                gte: now,
                lte: nextHour,
              },
            },
            include: {
              location: true,
            },
          },
        },
        where: {
          notificationConfig: {
            beforeShiftReminder: true,
          },
          deviceTokens: {
            some: {
              isActive: true,
            },
          },
        },
      });

      for (const user of usersWithConfig) {
        const config = user.notificationConfig!;
        const reminderMinutes = config.beforeShiftMinutes;

        for (const plantao of user.plantoes) {
          const timeDiff = plantao.startTime.getTime() - now.getTime();
          const minutesUntilShift = Math.floor(timeDiff / (1000 * 60));

          if (minutesUntilShift <= reminderMinutes && minutesUntilShift > 0) {
            try {
              const startTime = format(plantao.startTime, 'HH:mm');
              const endTime = format(plantao.endTime, 'HH:mm');
              const location = plantao.location?.name || 'Local não informado';

              const title = `⏰ Lembrete de Plantão`;
              const body = `Seu plantão em ${location} começa em ${minutesUntilShift} minutos (${startTime} - ${endTime})`;

              await this.sendNotificationToUser(user.clerkId, {
                title,
                body,
                type: 'before_shift',
                data: {
                  shiftId: plantao.id,
                  startTime: plantao.startTime.toISOString(),
                  minutesUntilShift,
                },
              });

              this.logger.log(
                `Lembrete antes do plantão enviado para usuário ${user.clerkId}, plantão ${plantao.id}`,
              );
            } catch (error) {
              this.logger.error(
                `Erro ao enviar lembrete antes do plantão: ${error.message}`,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro no job de lembretes antes dos plantões: ${error.message}`,
        error.stack,
      );
    }
  }

  async removeDeviceToken(clerkId: string, token: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      await this.prisma.deviceToken.deleteMany({
        where: {
          userId: user.id,
          token,
        },
      });

      this.logger.log(`Token do dispositivo removido para usuário ${clerkId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover token do dispositivo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUserDeviceTokens(clerkId: string): Promise<DeviceToken[]> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { clerkId },
        include: {
          deviceTokens: {
            where: { isActive: true },
            orderBy: { lastUsedAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com Clerk ID ${clerkId} não encontrado`,
        );
      }

      return user.deviceTokens;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar tokens do usuário: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
