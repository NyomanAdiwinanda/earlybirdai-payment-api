import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
