import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  receiveWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
  ) {
    return this.webhooksService.processIncoming(body, signature, requestId);
  }
}
