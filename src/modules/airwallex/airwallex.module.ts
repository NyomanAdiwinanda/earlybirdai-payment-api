import { Module } from '@nestjs/common';
import { AirwallexService } from './airwallex.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [AirwallexService],
  exports: [AirwallexService],
})
export class AirwallexModule {}
