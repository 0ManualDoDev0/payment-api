import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PAYMENT_QUEUE, WEBHOOK_QUEUE, PAYMENT_JOBS, WEBHOOK_JOBS } from './queues.constants';

@Injectable()
export class PaymentProducerService {
  constructor(
    @InjectQueue(PAYMENT_QUEUE) private readonly paymentQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  async enqueuePixPayment(paymentId: string, data: Record<string, any>) {
    return this.paymentQueue.add(PAYMENT_JOBS.PROCESS_PIX, { paymentId, ...data }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }

  async enqueueCreditCardPayment(paymentId: string, data: Record<string, any>) {
    return this.paymentQueue.add(PAYMENT_JOBS.PROCESS_CREDIT_CARD, { paymentId, ...data }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }

  async enqueueBoleto(paymentId: string, data: Record<string, any>) {
    return this.paymentQueue.add(PAYMENT_JOBS.PROCESS_BOLETO, { paymentId, ...data }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }

  async enqueueSubscription(paymentId: string, data: Record<string, any>) {
    return this.paymentQueue.add(PAYMENT_JOBS.PROCESS_SUBSCRIPTION, { paymentId, ...data }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  }

  async enqueueWebhook(eventId: string, data: Record<string, any>) {
    return this.webhookQueue.add(WEBHOOK_JOBS.PROCESS_WEBHOOK, { eventId, ...data }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 1000 },
    });
  }
}
