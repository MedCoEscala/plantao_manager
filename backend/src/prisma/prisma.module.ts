import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Torna o módulo global, PrismaService disponível em toda a aplicação
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Exporta o PrismaService para ser usado em outros módulos
})
export class PrismaModule {}
