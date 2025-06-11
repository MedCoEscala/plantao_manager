import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';

import { AppService } from './app.service';
import { ClerkAuthGuard } from './auth/guards/clerk-auth.guard';
import { NotificationsService } from './notifications/notifications.service';
import { PrismaService } from './prisma/prisma.service';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-notification')
  @UseGuards(ClerkAuthGuard)
  async testNotification(@Req() req: RequestWithUserContext) {
    const clerkId = req.userContext.sub;

    try {
      await this.notificationsService.sendNotificationToUser(clerkId, {
        title: '🏥 Teste de Notificação',
        body: 'Se você recebeu esta notificação, o sistema está funcionando perfeitamente!',
        data: { type: 'test', timestamp: new Date().toISOString() },
      });

      return {
        success: true,
        message: 'Notificação de teste enviada com sucesso!',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao enviar notificação de teste',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('health')
  async getHealth() {
    const startTime = Date.now();
    try {
      // Testar conectividade do banco
      const dbTest = await this.prisma.$queryRaw`SELECT 1 as health_check`;
      const dbTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          responseTime: `${dbTime}ms`,
          result: dbTest,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 3000,
          databaseConfigured: !!process.env.DATABASE_URL,
        },
      };
    } catch (error) {
      const dbTime = Date.now() - startTime;

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          status: 'error',
          responseTime: `${dbTime}ms`,
          error: error.message,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 3000,
          databaseConfigured: !!process.env.DATABASE_URL,
        },
      };
    }
  }
}
