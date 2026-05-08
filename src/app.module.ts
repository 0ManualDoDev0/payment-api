import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';
import { QueuesModule } from './queues/queues.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BullBoardDashboardModule } from './bull-board/bull-board.module';
import { BullBoardAuthMiddleware } from './bull-board/bull-board.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MercadoPagoModule,
    QueuesModule,
    PaymentsModule,
    WebhooksModule,
    BullBoardDashboardModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BullBoardAuthMiddleware)
      .forRoutes({ path: '/queues*', method: RequestMethod.ALL });
  }
}
