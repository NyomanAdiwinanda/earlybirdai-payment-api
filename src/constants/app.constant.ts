export const SUPPORTED_STRIPE_PAYMENT_EVENT = {
  'payment_intent.succeeded': 'payment_successful',
  'payment_intent.payment_failed': 'payment_failed',
  'charge.refunded': 'refund_processed',
};

export const SUPPORTED_AIRWALLEX_PAYMENT_EVENT = {
  'payment_attempt.paid': 'payment_successful',
  'payment_attempt.failed_to_process': 'payment_failed',
  'refund.settled': 'refund_processed',
};

export const LEDGER_ENTRY = {
  payment_successful: 'PAYMENT',
  payment_failed: 'PAYMENT',
  refund_processed: 'REFUND',
};

export const LEDGER_STATUS = {
  payment_successful: 'SUCCESS',
  payment_failed: 'FAILED',
  refund_processed: 'SUCCESS',
};
