import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import { PAYMENT_QUEUE, PAYMENT_JOBS } from './queues.constants';
import { PaymentStatus } from '@prisma/client';

@Processor(PAYMENT_QUEUE, { concurrency: 5 })
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mp: MercadoPagoService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.name} [${job.id}]`);

    switch (job.name) {
      case PAYMENT_JOBS.PROCESS_PIX:
        return this.processPixPayment(job);
      case PAYMENT_JOBS.PROCESS_CREDIT_CARD:
        return this.processCreditCardPayment(job);
      case PAYMENT_JOBS.PROCESS_BOLETO:
        return this.processBoleto(job);
      case PAYMENT_JOBS.PROCESS_SUBSCRIPTION:
        return this.processSubscription(job);
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  private async processPixPayment(job: Job) {
    const { paymentId, amount, description, email, firstName, lastName, expirationMinutes } = job.data;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PROCESSING },
    });

    const response = await this.mp.createPixPayment({
      amount, description, email, firstName, lastName, expirationMinutes,
    });

    const pointOfInteraction = (response as any).point_of_interaction;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        externalId: String(response.id),
        status: this.mapMpStatus((response as any).status),
        pixQrCode: pointOfInteraction?.transaction_data?.qr_code,
        pixQrCodeBase64: pointOfInteraction?.transaction_data?.qr_code_base64,
        pixExpiresAt: response.date_of_expiration ? new Date(response.date_of_expiration) : undefined,
        metadata: response as any,
      },
    });

    return { externalId: response.id };
  }

  private async processCreditCardPayment(job: Job) {
    const { paymentId, amount, description, email, token, installments, paymentMethodId, issuerId } = job.data;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PROCESSING },
    });

    const response = await this.mp.createCreditCardPayment({
      amount, description, email, token, installments, paymentMethodId, issuerId,
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        externalId: String(response.id),
        status: this.mapMpStatus((response as any).status),
        metadata: response as any,
      },
    });

    return { externalId: response.id, status: (response as any).status };
  }

  private async processBoleto(job: Job) {
    const { paymentId, amount, description, email, firstName, lastName, cpf, expirationDays } = job.data;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PROCESSING },
    });

    const response = await this.mp.createBoleto({
      amount, description, email, firstName, lastName, cpf, expirationDays,
    });

    const transactionDetails = (response as any).transaction_details;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        externalId: String(response.id),
        status: this.mapMpStatus((response as any).status),
        boletoUrl: transactionDetails?.external_resource_url,
        boletoBarcode: transactionDetails?.barcode?.content,
        boletoExpiresAt: response.date_of_expiration ? new Date(response.date_of_expiration) : undefined,
        metadata: response as any,
      },
    });

    return { externalId: response.id };
  }

  private async processSubscription(job: Job) {
    const { paymentId, planId, email, cardTokenId, reason } = job.data;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PROCESSING },
    });

    const response = await this.mp.createSubscription({ planId, email, cardTokenId, reason });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        externalId: String(response.id),
        subscriptionId: String(response.id),
        status: response.status === 'authorized' ? PaymentStatus.APPROVED : PaymentStatus.PENDING,
        metadata: response as any,
      },
    });

    return { externalId: response.id };
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
    this.logger.error(`Job ${job.name} [${job.id}] failed: ${error.message}`);

    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.prisma.payment.updateMany({
        where: { id: job.data.paymentId },
        data: {
          status: PaymentStatus.FAILED,
          lastError: error.message,
          retryCount: job.attemptsMade,
        },
      });
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.name} [${job.id}] completed`);
  }
}
