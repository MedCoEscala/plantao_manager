import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';

import { clerkClient } from '../../config/clerk.config';

interface RequestWithUserContext extends Request {
  userContext: Record<string, any>;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUserContext>();

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Token de autorização ausente ou malformatado');
        throw new UnauthorizedException(
          'Token de autorização ausente ou malformatado',
        );
      }

      const token = authHeader.split(' ')[1];

      const payload = await clerkClient.verifyToken(token);

      if (!payload || typeof payload !== 'object') {
        this.logger.warn(
          'Payload do token inválido ou não retornado como objeto',
        );
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      // Log do payload básico
      this.logger.log('Token verificado para usuário:', {
        sub: payload.sub,
        hasEmail: !!payload.email,
      });

      // Se não tem email no token, buscar apenas o email do Clerk (para autenticação)
      if (
        !payload.email &&
        !payload.email_address &&
        !payload.primary_email_address
      ) {
        this.logger.log('Buscando email do Clerk para autenticação...');

        try {
          const clerkUser = await clerkClient.users.getUser(payload.sub);

          // Buscar email pelo primaryEmailAddressId (método mais confiável)
          let primaryEmail = '';
          if (clerkUser.emailAddresses && clerkUser.primaryEmailAddressId) {
            const emailObj = clerkUser.emailAddresses.find(
              (e: any) => e.id === clerkUser.primaryEmailAddressId,
            );
            primaryEmail = emailObj?.emailAddress || '';
          }

          // Fallback: tentar primaryEmailAddress direto
          if (
            !primaryEmail &&
            (clerkUser as any).primaryEmailAddress?.emailAddress
          ) {
            primaryEmail = (clerkUser as any).primaryEmailAddress.emailAddress;
          }

          if (primaryEmail) {
            payload.email = primaryEmail;
            payload.email_address = primaryEmail;
            payload.primary_email_address = primaryEmail;
            this.logger.log(
              `✅ Email obtido para autenticação: ${primaryEmail}`,
            );
          } else {
            this.logger.error('❌ Não foi possível obter email do usuário');
          }
        } catch (clerkError) {
          this.logger.error('❌ Erro ao buscar email do Clerk:', clerkError);
          // Continuar sem email - o serviço de usuários tentará lidar com isso
        }
      }

      request.userContext = payload;

      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar token:', error);
      if (
        error instanceof Error &&
        (error.message.includes('invalid token') ||
          error.message.includes('expired'))
      ) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }
      throw new InternalServerErrorException(
        'Erro interno ao verificar autenticação',
      );
    }
  }
}
