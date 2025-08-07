import { Module } from '@nestjs/common';
import { ShiftTemplatesController } from './shift-templates.controller';
import { ShiftTemplatesService } from './shift-templates.service';
import { ShiftTemplatesSafeService } from './shift-templates-safe.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShiftTemplatesController],
  providers: [
    ShiftTemplatesService,
    ShiftTemplatesSafeService,
    // Usar o service seguro temporariamente
    {
      provide: ShiftTemplatesService,
      useClass: ShiftTemplatesSafeService,
    },
  ],
  exports: [ShiftTemplatesService],
})
export class ShiftTemplateModule {}
