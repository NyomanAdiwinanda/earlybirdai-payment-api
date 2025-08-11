import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeModule } from '../stripe/stripe.module';
import { AirwallexModule } from '../airwallex/airwallex.module';

@Module({
  imports: [StripeModule, AirwallexModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
