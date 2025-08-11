import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  CreatePaymentDto,
  StripePaymentData,
} from '../payments/dto/payment.dto';
import { SUPPORTED_STRIPE_PAYMENT_EVENT } from 'src/constants/app.constant';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {
    if (!process.env.STRIPE_API_KEY) {
      throw new Error('STRIPE_API_KEY environment variable is required');
    }

    this.stripe = new Stripe(process.env.STRIPE_API_KEY);
  }

  async mapStripeEventToPayment(
    eventData: StripePaymentData,
  ): Promise<CreatePaymentDto | null> {
    if (!this.isVerifiedPaymentEvent(eventData)) return null;

    const transactionId = this.getTransactionId(eventData);
    const amount = this.getAmount(eventData);
    const currency = this.getCurrency(eventData);
    const status = this.getStatus(eventData);
    const timestamp = this.getTimestamp(eventData);
    const customerEmail = await this.getCustomerEmail(eventData);

    return {
      transactionId,
      amount,
      currency,
      status,
      timestamp,
      source: 'stripe',
      customerEmail,
    };
  }

  async createStripePayment(paymentDto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: paymentDto,
    });

    await this.ledger.createLedgerFromPayment(payment.id, paymentDto);
  }

  async updateStripePayment(
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

  private getTransactionId(eventData: StripePaymentData): string {
    if (eventData.data.object.payment_intent) {
      return eventData.data.object.payment_intent;
    } else {
      return eventData.data.object.id;
    }
  }

  private getAmount(eventData: StripePaymentData): number {
    return eventData.data.object.amount / 100;
  }

  private getCurrency(eventData: StripePaymentData): string {
    return eventData.data.object.currency.toUpperCase();
  }

  private getStatus(eventData: StripePaymentData): string {
    const mappedStatus =
      SUPPORTED_STRIPE_PAYMENT_EVENT[
        eventData.type as keyof typeof SUPPORTED_STRIPE_PAYMENT_EVENT
      ];
    return mappedStatus || eventData.type;
  }

  private getTimestamp(eventData: StripePaymentData): Date {
    return new Date(eventData.created * 1000);
  }

  private async getCustomerEmail(
    eventData: StripePaymentData,
  ): Promise<string | null> {
    if (!eventData.data.object.customer) return null;

    const customer = await this.getCustomer(eventData.data.object.customer);
    return customer?.email || null;
  }

  private isVerifiedPaymentEvent(eventData: StripePaymentData): boolean {
    return eventData.type in SUPPORTED_STRIPE_PAYMENT_EVENT;
  }

  private async getCustomer(
    customerId: string,
  ): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve customer ${customerId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }
}
