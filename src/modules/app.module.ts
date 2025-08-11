import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, PaymentsModule, AuthModule],
})
export class AppModule {}
