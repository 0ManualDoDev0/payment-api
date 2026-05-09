import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_QUEUE, WEBHOOK_QUEUE } from '../queues/queues.constants';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(PAYMENT_QUEUE) private readonly paymentQueue: Queue,
    @InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  @Get()
  async check() {
    const [database, redis, queues] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
    ]);

    const status =
      database.status === 'ok' && redis.status === 'ok' ? 'ok' : 'error';

    return { status, database, redis, queues };
  }

  private async checkDatabase(): Promise<{ status: string; message?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<{ status: string; message?: string }> {
    try {
      const client = await this.paymentQueue.client;
      await client.ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }

  private async checkQueues() {
    const [paymentCounts, webhookCounts] = await Promise.allSettled([
      this.paymentQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
      this.webhookQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
    ]);

    return {
      [PAYMENT_QUEUE]:
        paymentCounts.status === 'fulfilled'
          ? paymentCounts.value
          : { error: (paymentCounts.reason as Error).message },
      [WEBHOOK_QUEUE]:
        webhookCounts.status === 'fulfilled'
          ? webhookCounts.value
          : { error: (webhookCounts.reason as Error).message },
    };
  }
}
