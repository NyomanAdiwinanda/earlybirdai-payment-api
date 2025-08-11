import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Get,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { StripePaymentData, AirwallexPaymentData } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhooks/payment')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: unknown,
    @Headers() headers: Record<string, string>,
  ) {
    try {
      if (headers['stripe-signature']) {
        return await this.paymentsService.processStripeWebhook(
          body as StripePaymentData,
        );
      } else if (headers['x-signature']) {
        return await this.paymentsService.processAirwallexWebhook(
          body as AirwallexPaymentData,
        );
      } else {
        throw new BadRequestException('Invalid webhook type');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Webhook processing failed: ${errorMessage}`);
      throw error;
    }
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  async getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  @Get('payments/successful')
  @UseGuards(JwtAuthGuard)
  async getSuccessfulPayments() {
    return this.paymentsService.getPaymentsByStatus('payment_successful');
  }

  @Get('payments/failed')
  @UseGuards(JwtAuthGuard)
  async getFailedPayments() {
    return this.paymentsService.getPaymentsByStatus('payment_failed');
  }

  @Get('payments/refunds')
  @UseGuards(JwtAuthGuard)
  async getRefunds() {
    return this.paymentsService.getPaymentsByStatus('refund_processed');
  }
}
