import { Injectable, Logger } from '@nestjs/common';
import {
  StripePaymentData,
  AirwallexPaymentData,
  PaymentResponseDto,
} from './dto/payment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { AirwallexService } from '../airwallex/airwallex.service';
import { Payment } from 'generated/prisma';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private airwallex: AirwallexService,
  ) {}

  async processStripeWebhook(eventData: StripePaymentData): Promise<void> {
    try {
      const paymentDto = await this.stripe.mapStripeEventToPayment(eventData);
      if (!paymentDto) return;

      const existingPayment = await this.checkExistingPayment(
        paymentDto.transactionId,
      );

      if (existingPayment) {
        if (existingPayment.status !== paymentDto.status) {
          return this.stripe.updateStripePayment(
            existingPayment.id,
            paymentDto,
          );
        } else {
          throw new Error(
            `Duplicate transaction with same status detected: ${paymentDto.transactionId} (${paymentDto.status})`,
          );
        }
      }

      return await this.stripe.createStripePayment(paymentDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing payment event: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async processAirwallexWebhook(
    eventData: AirwallexPaymentData,
  ): Promise<void> {
    try {
      const paymentDto = this.airwallex.mapAirwallexEventToPayment(eventData);
      if (!paymentDto) return;

      const existingPayment = await this.checkExistingPayment(
        paymentDto.transactionId,
      );

      if (existingPayment) {
        if (existingPayment.status !== paymentDto.status) {
          return this.airwallex.updateAirwallexPayment(
            existingPayment.id,
            paymentDto,
          );
        } else {
          throw new Error(
            `Duplicate transaction with same status detected: ${paymentDto.transactionId} (${paymentDto.status})`,
          );
        }
      }

      return await this.airwallex.createAirwallexPayment(paymentDto);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing payment event: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async getAllPayments(): Promise<PaymentResponseDto> {
    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Payments retrieved successfully',
      statusCode: 200,
      data: payments,
    };
  }

  async getPaymentsByStatus(status: string): Promise<PaymentResponseDto> {
    const payments = await this.prisma.payment.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: `${status} payments retrieved successfully`,
      statusCode: 200,
      data: payments,
    };
  }

  private async checkExistingPayment(transactionId: string) {
    const existingPayment: Payment | null =
      await this.prisma.payment.findUnique({
        where: { transactionId },
      });

    return existingPayment;
  }
}
