import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { PAYMENT_QUEUE, WEBHOOK_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: PAYMENT_QUEUE,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: WEBHOOK_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
})
export class BullBoardDashboardModule {}
