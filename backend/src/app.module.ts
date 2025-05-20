import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ContractorsModule } from './contractors/contractors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    ShiftsModule,
    ContractorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
