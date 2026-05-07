import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProducerService } from '../queues/payment.producer.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly producer: PaymentProducerService,
    private readonly config: ConfigService,
  ) {}

  async processIncoming(
    body: any,
    signature: string | undefined,
    requestId: string | undefined,
  ) {
    if (this.config.get('MP_WEBHOOK_SECRET')) {
      this.validateSignature(body, signature, requestId);
    }

    const topic: string = body.topic || body.type || 'unknown';
    const resourceId: string = body.data?.id ?? body.resource;
    const action: string | undefined = body.action;

    const eventId = requestId ?? `${topic}-${resourceId}-${Date.now()}`;

    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      this.logger.warn(`Duplicate webhook event: ${eventId}`);
      return { received: true, duplicate: true };
    }

    await this.prisma.webhookEvent.create({
      data: {
        eventId,
        topic,
        action,
        resourceId,
        payload: body,
      },
    });

    await this.producer.enqueueWebhook(eventId, { topic, resourceId, action });

    this.logger.log(`Webhook enqueued: ${topic} / ${resourceId}`);
    return { received: true };
  }

  private validateSignature(
    body: any,
    xSignature: string | undefined,
    xRequestId: string | undefined,
  ) {
    const secret = this.config.getOrThrow<string>('MP_WEBHOOK_SECRET');

    if (!xSignature || !xRequestId) {
      throw new BadRequestException('Missing webhook signature headers');
    }

    const parts = Object.fromEntries(
      xSignature.split(',').map((p) => p.split('=')),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];

    if (!ts || !v1) {
      throw new BadRequestException('Invalid x-signature format');
    }

    const dataId = body?.data?.id ?? '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');

    if (expected !== v1) {
      throw new BadRequestException('Webhook signature mismatch');
    }
  }
}
