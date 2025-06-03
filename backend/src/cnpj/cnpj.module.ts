import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CNPJController } from './cnpj.controller';
import { CNPJService } from './cnpj.service';

@Module({
  imports: [PrismaModule],
  controllers: [CNPJController],
  providers: [CNPJService],
  exports: [CNPJService],
})
export class CNPJModule {}
