import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DeviceToken, NotificationConfig } from '@prisma/client';
import {
  addDays,
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  subWeeks,
  getDay,
  addMinutes,
  isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
          priority: 'high',
          channelId: notificationDto.type === 'weekly_report' || notificationDto.type === 'monthly_report' ? 'reports' : 
                    notificationDto.type === 'daily_reminder' || notificationDto.type === 'before_shift' ? 'shifts' : 
                    'default',
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

  @Cron('0 * * * *')
  async sendWeeklyReports(): Promise<void> {
    this.logger.log('🗓️ Verificando envio de relatórios semanais');

    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDayOfWeek = getDay(now);

      const usersWithConfig = await this.prisma.user.findMany({
        include: {
          notificationConfig: true,
          deviceTokens: {
            where: { isActive: true },
          },
        },
        where: {
          notificationConfig: {
            weeklyReport: true,
          },
          deviceTokens: {
            some: {
              isActive: true,
            },
          },
        },
      });

      this.logger.log(
        `📊 Encontrados ${usersWithConfig.length} usuários com relatório semanal ativo`,
      );

      for (const user of usersWithConfig) {
        try {
          const config = user.notificationConfig!;

          const targetDayOfWeek =
            config.weeklyReportDay === 7 ? 0 : config.weeklyReportDay;

          const [targetHour] = config.weeklyReportTime
            .split(':')
            .map(Number);

          const isCorrectDay = currentDayOfWeek === targetDayOfWeek;
          const isCorrectTime = currentHour === targetHour && currentMinute === 0;

          if (!isCorrectDay || !isCorrectTime) {
            continue;
          }

          this.logger.log(
            `📊 Enviando relatório semanal para usuário ${user.clerkId} - Dia: ${currentDayOfWeek}/${targetDayOfWeek}, Hora: ${currentHour}/${targetHour}`,
          );

          // Calcular período da semana anterior
          const weekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); // Segunda-feira da semana passada
          const weekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); // Domingo da semana passada

          // Buscar plantões da semana anterior
          const weeklyShifts = await this.prisma.plantao.findMany({
            where: {
              userId: user.id,
              date: {
                gte: weekStart,
                lte: weekEnd,
              },
            },
            include: {
              location: true,
              contractor: true,
            },
            orderBy: {
              date: 'asc',
            },
          });

          if (weeklyShifts.length === 0) {
            // Enviar notificação mesmo sem plantões
            const title = `📊 Relatório Semanal - ${format(weekStart, 'dd/MM', { locale: ptBR })} a ${format(weekEnd, 'dd/MM', { locale: ptBR })}`;
            const body = 'Você não teve plantões na semana passada. 🏖️';

            await this.sendNotificationToUser(user.clerkId, {
              title,
              body,
              type: 'weekly_report',
              data: {
                weekStart: format(weekStart, 'yyyy-MM-dd'),
                weekEnd: format(weekEnd, 'yyyy-MM-dd'),
                shiftsCount: 0,
                totalValue: 0,
                totalHours: 0,
              },
            });
            continue;
          }

          // Calcular estatísticas
          const totalValue = weeklyShifts.reduce(
            (sum, shift) => sum + shift.value,
            0,
          );
          const totalHours = this.calculateTotalHours(weeklyShifts);
          const uniqueLocations = new Set(
            weeklyShifts.map((shift) => shift.location?.name).filter(Boolean),
          ).size;

          // Agrupar plantões por dia
          const shiftsByDay = this.groupShiftsByDay(weeklyShifts);

          // Construir resumo detalhado
          let detailedSummary = '';
          Object.entries(shiftsByDay).forEach(([day, shifts]) => {
            const dayName = format(new Date(day), 'EEEE', { locale: ptBR });
            const dayShifts = shifts
              .map((shift) => {
                const startTime = format(shift.startTime, 'HH:mm');
                const endTime = format(shift.endTime, 'HH:mm');
                const location = shift.location?.name || 'Local não informado';
                return `  📍 ${location}: ${startTime}-${endTime}`;
              })
              .join('\n');

            detailedSummary += `\n📅 ${dayName}:\n${dayShifts}\n`;
          });

          // Criar mensagem do relatório
          const title = `📊 Relatório Semanal - ${format(weekStart, 'dd/MM', { locale: ptBR })} a ${format(weekEnd, 'dd/MM', { locale: ptBR })}`;

          let body = `Resumo da sua semana:\n\n`;
          body += `🔢 Total de plantões: ${weeklyShifts.length}\n`;
          body += `⏱️ Horas trabalhadas: ${totalHours.toFixed(1)}h\n`;
          body += `💰 Valor total: R$ ${totalValue.toFixed(2).replace('.', ',')}\n`;
          body += `🏥 Locais diferentes: ${uniqueLocations}\n`;
          body += detailedSummary;

          await this.sendNotificationToUser(user.clerkId, {
            title,
            body,
            type: 'weekly_report',
            data: {
              weekStart: format(weekStart, 'yyyy-MM-dd'),
              weekEnd: format(weekEnd, 'yyyy-MM-dd'),
              shiftsCount: weeklyShifts.length,
              totalValue,
              totalHours,
              uniqueLocations,
            },
          });

          this.logger.log(
            `✅ Relatório semanal enviado para usuário ${user.clerkId}`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Erro ao enviar relatório semanal para usuário ${user.clerkId}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `❌ Erro no job de relatórios semanais: ${error.message}`,
        error.stack,
      );
    }
  }

  // 🆕 NOVO: Método auxiliar para calcular horas totais
  private calculateTotalHours(shifts: any[]): number {
    return shifts.reduce((total, shift) => {
      const startTime = new Date(shift.startTime);
      const endTime = new Date(shift.endTime);

      // Se horário de fim é menor que início, assumir que vai até o dia seguinte
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      const diffMs = endTime.getTime() - startTime.getTime();
      const hours = diffMs / (1000 * 60 * 60);

      return total + hours;
    }, 0);
  }

  // 🆕 NOVO: Método auxiliar para agrupar plantões por dia
  private groupShiftsByDay(shifts: any[]): Record<string, any[]> {
    return shifts.reduce((groups, shift) => {
      const dateKey = format(shift.date, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(shift);
      return groups;
    }, {});
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
