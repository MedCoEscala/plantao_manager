import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CNPJModule } from './cnpj/cnpj.module';
import { ContractorsModule } from './contractors/contractors.module';
import { LocationsModule } from './locations/location.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PrivacyController } from './privacy/privacy.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ShiftsModule } from './shifts/shifts.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    ShiftsModule,
    LocationsModule,
    ContractorsModule,
    PaymentsModule,
    CNPJModule,
    NotificationsModule,
  ],
  controllers: [AppController, PrivacyController],
  providers: [AppService],
})
export class AppModule {}
