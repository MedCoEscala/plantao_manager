import { Module } from '@nestjs/common';
import { ShiftTemplatesController } from './shift-templates.controller';
import { ShiftTemplatesService } from './shift-templates.service';
import { ShiftTemplatesSafeService } from './shift-templates-safe.service';

import { PrismaModule } from '../prisma/prisma.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [PrismaModule, ShiftsModule],
  controllers: [ShiftTemplatesController],
  providers: [
    ShiftTemplatesService,
    ShiftTemplatesSafeService,
    // ✅ MIGRAÇÃO APLICADA - Habilitando service completo
    // {
    //   provide: ShiftTemplatesService,
    //   useClass: ShiftTemplatesSafeService,
    // },
  ],
  exports: [ShiftTemplatesService],
})
export class ShiftTemplateModule {}
