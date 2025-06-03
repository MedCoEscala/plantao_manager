import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ContractorsModule } from './contractors/contractors.module';
import { LocationsModule } from './locations/location.module';
import { PaymentsModule } from './payments/payments.module';
import { CNPJModule } from './cnpj/cnpj.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
