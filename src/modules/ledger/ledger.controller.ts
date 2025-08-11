import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  private readonly logger = new Logger(LedgerController.name);

  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  getAllLedgerEntries() {
    return this.ledgerService.getAllLedgerEntries();
  }

  @Get('balance')
  getCurrentBalance() {
    return this.ledgerService.getCurrentBalance();
  }

  @Get('payment/:paymentId')
  getLedgerByPaymentId(@Param('paymentId') paymentId: string) {
    return this.ledgerService.getLedgerByPaymentId(paymentId);
  }

  @Get('currency/:currency')
  getLedgerByCurrency(@Param('currency') currency: string) {
    return this.ledgerService.getLedgerByCurrency(currency);
  }

  @Get('entry-type/:entryType')
  getLedgerByEntryType(@Param('entryType') entryType: string) {
    return this.ledgerService.getLedgerByEntryType(entryType);
  }

  @Get('status/:status')
  getLedgerByStatus(@Param('status') status: string) {
    return this.ledgerService.getLedgerByStatus(status);
  }
}
