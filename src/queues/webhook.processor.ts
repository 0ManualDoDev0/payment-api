import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { WEBHOOK_QUEUE, WEBHOOK_JOBS } from './queues.constants';
import { PaymentStatus } from '@prisma/client';

@Processor(WEBHOOK_QUEUE, { concurrency: 3 })
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    if (job.name === WEBHOOK_JOBS.PROCESS_WEBHOOK) {
      return this.processWebhookEvent(job);
    }
    throw new Error(`Unknown webhook job: ${job.name}`);
  }

  private async processWebhookEvent(job: Job) {
    const { eventId, topic, resourceId } = job.data;

    if (topic !== 'payment' || !resourceId) {
      await this.markProcessed(eventId);
      return;
    }

    const mpPayment = await this.mp.getPayment(resourceId);
    const externalId = String(mpPayment.id);

    const payment = await this.prisma.payment.findUnique({ where: { externalId } });

    if (!payment) {
      this.logger.warn(`Payment not found for external ID: ${externalId}`);
      await this.markProcessed(eventId);
      return;
    }

    const newStatus = this.mapMpStatus((mpPayment as any).status);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus, metadata: mpPayment as any },
    });

    await this.markProcessed(eventId);

    this.logger.log(`Webhook processed: payment ${payment.id} → ${newStatus}`);
  }

  private async markProcessed(eventId: string) {
    await this.prisma.webhookEvent.updateMany({
      where: { eventId },
      data: { processed: true, processedAt: new Date() },
    });
  }

  private mapMpStatus(mpStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      in_process: PaymentStatus.PROCESSING,
      in_mediation: PaymentStatus.PROCESSING,
      rejected: PaymentStatus.REJECTED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      charged_back: PaymentStatus.CHARGED_BACK,
    };
    return map[mpStatus] ?? PaymentStatus.PENDING;
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Webhook job [${job.id}] failed: ${error.message}`);

    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.prisma.webhookEvent.updateMany({
        where: { eventId: job.data.eventId },
        data: { error: error.message },
      });
    }
  }
}
