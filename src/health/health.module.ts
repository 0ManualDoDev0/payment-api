import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HealthController } from './health.controller';
import { PAYMENT_QUEUE, WEBHOOK_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: PAYMENT_QUEUE }, { name: WEBHOOK_QUEUE }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
