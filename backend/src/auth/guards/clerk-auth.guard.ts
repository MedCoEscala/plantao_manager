import clerkClient from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUserId extends Request {
  userContext: {
    userId: string;
  };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUserId>();

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Token de autorização ausente ou malformatado');
        throw new UnauthorizedException(
          'Token de autorização ausente ou malformatado',
        );
      }

      const token = authHeader.split(' ')[1];

      const session = await clerkClient.verifyToken(token);
      if (!session) {
        this.logger.warn('Token inválido ou expirado');
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      request.userContext = { userId: session.sub };
      this.logger.log(`Acesso autorizado para userId: ${session.sub}`);

      return true;
    } catch (error) {
      this.logger.error('Erro ao verificar token:', error);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
