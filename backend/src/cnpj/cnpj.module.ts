import { Module } from '@nestjs/common';

import { CNPJController } from './cnpj.controller';
import { CNPJService } from './cnpj.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CNPJController],
  providers: [CNPJService],
  exports: [CNPJService],
})
export class CNPJModule {}
