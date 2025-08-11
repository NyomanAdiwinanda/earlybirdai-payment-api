import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import {
  CreatePaymentDto,
  AirwallexPaymentData,
} from '../payments/dto/payment.dto';
import { SUPPORTED_AIRWALLEX_PAYMENT_EVENT } from 'src/constants/app.constant';

@Injectable()
export class AirwallexService {
  private readonly logger = new Logger(AirwallexService.name);

  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  mapAirwallexEventToPayment(
    eventData: AirwallexPaymentData,
  ): CreatePaymentDto | null {
    if (!this.isVerifiedPaymentEvent(eventData)) return null;

    const transactionId = this.getTransactionId(eventData);
    const amount = this.getAmount(eventData);
    const currency = this.getCurrency(eventData);
    const status = this.getStatus(eventData);
    const timestamp = this.getTimestamp(eventData);

    return {
      transactionId,
      amount,
      currency,
      status,
      timestamp,
      source: 'airwallex',
      customerEmail: null,
    };
  }

  async createAirwallexPayment(paymentDto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: paymentDto,
    });

    await this.ledger.createLedgerFromPayment(payment.id, paymentDto);
  }

  async updateAirwallexPayment(
    existingPaymentId: string,
    paymentDto: CreatePaymentDto,
  ) {
    await this.prisma.payment.update({
      where: { transactionId: paymentDto.transactionId },
      data: {
        status: paymentDto.status,
        timestamp: paymentDto.timestamp,
      },
    });

    await this.ledger.createLedgerFromPayment(existingPaymentId, paymentDto);
  }

  private getTransactionId(eventData: AirwallexPaymentData): string {
    if (eventData.data.object.payment_intent_id) {
      return eventData.data.object.payment_intent_id;
    } else {
      return eventData.data.object.id;
    }
  }

  private getAmount(eventData: AirwallexPaymentData): number {
    return eventData.data.object.amount;
  }

  private getCurrency(eventData: AirwallexPaymentData): string {
    return eventData.data.object.currency.toUpperCase();
  }

  private getStatus(eventData: AirwallexPaymentData): string {
    const mappedStatus =
      SUPPORTED_AIRWALLEX_PAYMENT_EVENT[
        eventData.name as keyof typeof SUPPORTED_AIRWALLEX_PAYMENT_EVENT
      ];
    return mappedStatus || eventData.name;
  }

  private getTimestamp(eventData: AirwallexPaymentData): Date {
    return eventData.data.object.created_at;
  }

  private isVerifiedPaymentEvent(eventData: AirwallexPaymentData): boolean {
    return eventData.name in SUPPORTED_AIRWALLEX_PAYMENT_EVENT;
  }
}
