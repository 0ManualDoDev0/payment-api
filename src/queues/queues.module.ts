import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PAYMENT_QUEUE, WEBHOOK_QUEUE } from './queues.constants';
import { PaymentProcessor } from './payment.processor';
import { WebhookProcessor } from './webhook.processor';
import { PaymentProducerService } from './payment.producer.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  };
}

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const connection = redisUrl
          ? parseRedisUrl(redisUrl)
          : {
              host: config.get('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
              password: config.get('REDIS_PASSWORD'),
            };

        return {
          connection,
          defaultJobOptions: {
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 },
          },
        };
      },
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
