import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PAYMENT_QUEUE, WEBHOOK_QUEUE } from './queues.constants';
import { PaymentProcessor } from './payment.processor';
import { WebhookProcessor } from './webhook.processor';
import { PaymentProducerService } from './payment.producer.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: PAYMENT_QUEUE },
      { name: WEBHOOK_QUEUE },
    ),
    MercadoPagoModule,
  ],
  providers: [PaymentProcessor, WebhookProcessor, PaymentProducerService],
  exports: [PaymentProducerService, BullModule],
})
export class QueuesModule {}
