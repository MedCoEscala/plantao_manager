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

      // Log detalhado do payload para debug
      this.logger.log('Payload do token verificado:', {
        sub: payload.sub,
        email: payload.email,
        keys: Object.keys(payload),
        hasEmail: !!payload.email,
        hasEmailAddress: !!payload.email_address,
        hasPrimaryEmailAddress: !!payload.primary_email_address,
      });

      // DEBUG: Log completo do payload para investigação
      this.logger.log(
        'Payload completo do token:',
        JSON.stringify(payload, null, 2),
      );

      // SEMPRE buscar dados completos do usuário da API do Clerk para garantir dados atualizados
      try {
        const clerkUser = await clerkClient.users.getUser(payload.sub);
        const clerkUserAny = clerkUser as any;

        this.logger.log('Usuário obtido da API do Clerk:', {
          id: clerkUser.id,
          primaryEmailAddressId: clerkUser.primaryEmailAddressId,
          emailAddressesCount: clerkUser.emailAddresses?.length || 0,
          hasDirectPrimaryEmail:
            !!clerkUserAny.primaryEmailAddress?.emailAddress,
        });

        // Buscar email pelo primaryEmailAddressId (método mais confiável)
        let primaryEmail = '';
        if (clerkUser.emailAddresses && clerkUser.primaryEmailAddressId) {
          const emailObj = clerkUser.emailAddresses.find(
            (e: any) => e.id === clerkUser.primaryEmailAddressId,
          );
          primaryEmail = emailObj?.emailAddress || '';
        }

        // Fallback: tentar primaryEmailAddress direto
        if (!primaryEmail && clerkUserAny.primaryEmailAddress?.emailAddress) {
          primaryEmail = clerkUserAny.primaryEmailAddress.emailAddress;
        }

        // Adicionar dados completos ao payload
        if (primaryEmail) {
          payload.email = primaryEmail;
          payload.email_address = primaryEmail;
          payload.primary_email_address = primaryEmail;
          this.logger.log(`✅ Email encontrado e adicionado: ${primaryEmail}`);
        } else {
          this.logger.error('❌ Nenhum email encontrado para o usuário');
          // Log completo do usuário para debug
          this.logger.error(
            'Dados completos do usuário:',
            JSON.stringify(clerkUser, null, 2),
          );
        }

        // Adicionar outros dados úteis do Clerk ao contexto
        payload.firstName = clerkUser.firstName;
        payload.lastName = clerkUser.lastName;
        payload.imageUrl = clerkUser.imageUrl;
        payload.clerkUserData = {
          id: clerkUser.id,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          primaryEmailAddressId: clerkUser.primaryEmailAddressId,
          emailAddresses: clerkUser.emailAddresses,
          phoneNumbers: clerkUser.phoneNumbers,
          publicMetadata: clerkUser.publicMetadata,
        };
      } catch (clerkError) {
        this.logger.error(
          '❌ Erro crítico ao buscar usuário na API do Clerk:',
          clerkError,
        );
        // Se falhar, ainda permitir passar, mas sem dados de email
        // O serviço de usuários tentará buscar novamente
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
