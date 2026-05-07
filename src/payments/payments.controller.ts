import {
  Body, Controller, Get, Param, Patch, Post, Query,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import { CreateBoletoPaymentDto } from './dto/create-boleto-payment.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  @HttpCode(HttpStatus.ACCEPTED)
  createPix(@Body() dto: CreatePixPaymentDto) {
    return this.paymentsService.createPix(dto);
  }

  @Post('credit-card')
  @HttpCode(HttpStatus.ACCEPTED)
  createCreditCard(@Body() dto: CreateCardPaymentDto) {
    return this.paymentsService.createCreditCard(dto);
  }

  @Post('boleto')
  @HttpCode(HttpStatus.ACCEPTED)
  createBoleto(@Body() dto: CreateBoletoPaymentDto) {
    return this.paymentsService.createBoleto(dto);
  }

  @Post('subscription')
  @HttpCode(HttpStatus.ACCEPTED)
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.paymentsService.createSubscription(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.paymentsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      type,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.cancel(id);
  }
}
