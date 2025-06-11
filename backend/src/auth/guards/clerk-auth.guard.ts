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
        console.error('❌ [Auth] Token de autorização ausente ou malformatado');
        console.error('❌ [Auth] AuthHeader recebido:', authHeader);
        this.logger.warn('Token de autorização ausente ou malformatado');
        throw new UnauthorizedException(
          'Token de autorização ausente ou malformatado',
        );
      }

      const token = authHeader.split(' ')[1];

      const payload = await clerkClient.verifyToken(token);

      if (!payload || typeof payload !== 'object') {
        console.error('❌ [Auth] Payload inválido:', payload);
        this.logger.warn(
          'Payload do token inválido ou não retornado como objeto',
        );
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      request.userContext = payload;

      return true;
    } catch (error) {
      console.error('❌ [Auth] Erro detalhado:', error);
      console.error('❌ [Auth] Stack trace:', error.stack);

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
