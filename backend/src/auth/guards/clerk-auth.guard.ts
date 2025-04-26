import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Guarda de autenticação simples que verifica se req.auth.userId existe.
 * Pressupõe que um middleware anterior (como ClerkExpressRequireAuth ou similar)
 * já validou o token e populou req.auth.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { auth?: { userId?: string } }>();

    const userId = request.auth?.userId;

    if (!userId) {
      this.logger.warn(
        'Tentativa de acesso não autorizado: req.auth.userId ausente. O middleware de autenticação falhou ou não foi executado antes deste guard?',
      );
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    this.logger.log(`ClerkAuthGuard: Acesso autorizado para userId: ${userId}`);
    return true;
  }
}
