import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import {
  CreateLedgerDto,
  LedgerEntriesResponseDto,
  BalanceResponseDto,
} from './dto/ledger.dto';
import { LEDGER_ENTRY, LEDGER_STATUS } from 'src/constants/app.constant';

interface ExchangeRateResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private prisma: PrismaService) {}

  async createLedgerFromPayment(
    paymentId: string,
    paymentDto: CreatePaymentDto,
  ): Promise<void> {
    const ledgerDto = await this.mapPaymentToLedger(paymentId, paymentDto);
    await this.prisma.ledger.create({
      data: ledgerDto,
    });
  }

  private async mapPaymentToLedger(
    paymentId: string,
    paymentDto: CreatePaymentDto,
  ): Promise<CreateLedgerDto> {
    const entryType = this.getLedgerEntry(paymentDto.status);
    const status = this.getLedgerStatus(paymentDto.status);
    const currency = paymentDto.currency;
    const credit = this.getLedgerCredit(entryType, status, paymentDto.amount);
    const debit = this.getLedgerDebit(entryType, status, paymentDto.amount);

    const conversionRate = await this.getConversionRateToUSD(currency);
    const creditBase = this.convertToBaseAmount(credit, conversionRate);
    const debitBase = this.convertToBaseAmount(debit, conversionRate);
    const balanceAfterBase = await this.calculateNewBalance(
      creditBase,
      debitBase,
    );

    const description = this.getLedgerDescription(
      entryType,
      status,
      paymentDto.source,
      paymentDto.transactionId,
    );

    return {
      paymentId,
      entryType,
      status,
      currency,
      credit,
      debit,
      conversionRate,
      creditBase,
      debitBase,
      balanceAfterBase,
      description,
      timestamp: paymentDto.timestamp,
    };
  }

  private getLedgerEntry(status: string): string {
    const mappedEntry = LEDGER_ENTRY[status as keyof typeof LEDGER_ENTRY];
    return mappedEntry || 'OTHER';
  }

  private getLedgerStatus(status: string): string {
    const mappedStatus = LEDGER_STATUS[status as keyof typeof LEDGER_STATUS];
    return mappedStatus || 'OTHER';
  }

  private getLedgerCredit(
    entryType: string,
    status: string,
    amount: number,
  ): number {
    if (entryType === 'REFUND' || status === 'FAILED') return 0;

    return amount;
  }

  private getLedgerDebit(
    entryType: string,
    status: string,
    amount: number,
  ): number {
    if (entryType === 'PAYMENT' || status === 'FAILED') return 0;

    return amount;
  }

  private async getConversionRateToUSD(currency: string): Promise<number> {
    if (currency === 'USD') {
      return 1;
    }

    try {
      const response = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPEN_EXCHANGE_APP_ID}&base=USD&prettyprint=false&show_alternative=false`,
      );

      if (!response.ok) {
        this.logger.warn(`Failed to fetch exchange rates: ${response.status}`);
        return 1;
      }

      const data = (await response.json()) as ExchangeRateResponse;
      const rates = data.rates;

      if (!rates[currency]) {
        this.logger.warn(`Currency ${currency} not found in exchange rates`);
        return 1;
      }

      const rate = 1 / rates[currency];
      return parseFloat(rate.toFixed(6));
    } catch (error) {
      this.logger.error(
        `Error fetching exchange rates: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return 1;
    }
  }

  private convertToBaseAmount(amount: number, conversionRate: number): number {
    return parseFloat((amount * conversionRate).toFixed(3));
  }

  private async calculateNewBalance(
    creditBase: number,
    debitBase: number,
  ): Promise<number> {
    const latestLedger = await this.prisma.ledger.findFirst({
      select: {
        balanceAfterBase: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const previousBalance = (latestLedger?.balanceAfterBase as number) ?? 0;
    const newBalance = previousBalance + creditBase - debitBase;
    return parseFloat(newBalance.toFixed(3));
  }

  private getLedgerDescription(
    entryType: string,
    status: string,
    source: string,
    transactionId: string,
  ): string {
    if (entryType === 'PAYMENT') {
      if (status === 'SUCCESS') {
        return `Payment from ${source}`;
      } else {
        return `Failed payment from ${source}`;
      }
    } else {
      return `Refund for transaction ${transactionId}`;
    }
  }

  async getAllLedgerEntries(): Promise<LedgerEntriesResponseDto> {
    const ledgerEntries = await this.prisma.ledger.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Ledger entries retrieved successfully',
      statusCode: 200,
      data: ledgerEntries,
    };
  }

  async getCurrentBalance(): Promise<BalanceResponseDto> {
    const latestLedger = await this.prisma.ledger.findFirst({
      select: {
        balanceAfterBase: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const balance = {
      balance: (latestLedger?.balanceAfterBase as number) || 0,
      currency: 'USD',
    };

    return {
      message: 'Current balance retrieved successfully',
      statusCode: 200,
      data: balance,
    };
  }

  async getLedgerByPaymentId(
    paymentId: string,
  ): Promise<LedgerEntriesResponseDto> {
    const ledgerEntries = await this.prisma.ledger.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: `Ledger entries for payment ${paymentId} retrieved successfully`,
      statusCode: 200,
      data: ledgerEntries,
    };
  }

  async getLedgerByCurrency(
    currency: string,
  ): Promise<LedgerEntriesResponseDto> {
    const ledgerEntries = await this.prisma.ledger.findMany({
      where: { currency: currency.toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: `Ledger entries for currency ${currency.toUpperCase()} retrieved successfully`,
      statusCode: 200,
      data: ledgerEntries,
    };
  }

  async getLedgerByEntryType(
    entryType: string,
  ): Promise<LedgerEntriesResponseDto> {
    const ledgerEntries = await this.prisma.ledger.findMany({
      where: { entryType: entryType.toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: `Ledger entries for entry type ${entryType.toUpperCase()} retrieved successfully`,
      statusCode: 200,
      data: ledgerEntries,
    };
  }

  async getLedgerByStatus(status: string): Promise<LedgerEntriesResponseDto> {
    const ledgerEntries = await this.prisma.ledger.findMany({
      where: { status: status.toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: `Ledger entries for status ${status.toUpperCase()} retrieved successfully`,
      statusCode: 200,
      data: ledgerEntries,
    };
  }
}
