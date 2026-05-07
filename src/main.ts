import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Payment API')
    .setDescription('API de pagamentos com Mercado Pago — PIX, cartão, boleto e assinaturas')
    .setVersion('1.0')
    .addTag('payments')
    .addTag('webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application running on http://localhost:${port}/api`);
  logger.log(`Swagger docs:        http://localhost:${port}/docs`);
  logger.log(`Bull Board dashboard: http://localhost:${port}/queues`);
}

bootstrap();
