export const PAYMENT_QUEUE = 'payment-processing';
export const WEBHOOK_QUEUE = 'webhook-processing';

export const PAYMENT_JOBS = {
  PROCESS_PIX: 'process-pix',
  PROCESS_CREDIT_CARD: 'process-credit-card',
  PROCESS_BOLETO: 'process-boleto',
  PROCESS_SUBSCRIPTION: 'process-subscription',
  RETRY_PAYMENT: 'retry-payment',
} as const;

export const WEBHOOK_JOBS = {
  PROCESS_WEBHOOK: 'process-webhook',
} as const;
