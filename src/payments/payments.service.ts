import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProducerService } from '../queues/payment.producer.service';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import { CreateBoletoPaymentDto } from './dto/create-boleto-payment.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PaymentType } from '@prisma/client';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly producer: PaymentProducerService,
  ) {}

  async createPix(dto: CreatePixPaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        type: PaymentType.PIX,
        amount: dto.amount,
        description: dto.description,
        customerEmail: dto.email,
        customerName: `${dto.firstName} ${dto.lastName}`,
      },
    });

    await this.producer.enqueuePixPayment(payment.id, {
      amount: dto.amount,
      description: dto.description,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      expirationMinutes: dto.expirationMinutes,
    });

    return payment;
  }

  async createCreditCard(dto: CreateCardPaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        type: PaymentType.CREDIT_CARD,
        amount: dto.amount,
        description: dto.description,
        customerEmail: dto.email,
      },
    });

    await this.producer.enqueueCreditCardPayment(payment.id, {
      amount: dto.amount,
      description: dto.description,
      email: dto.email,
      token: dto.token,
      installments: dto.installments,
      paymentMethodId: dto.paymentMethodId,
      issuerId: dto.issuerId,
    });

    return payment;
  }

  async createBoleto(dto: CreateBoletoPaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        type: PaymentType.BOLETO,
        amount: dto.amount,
        description: dto.description,
        customerEmail: dto.email,
        customerName: `${dto.firstName} ${dto.lastName}`,
      },
    });

    await this.producer.enqueueBoleto(payment.id, {
      amount: dto.amount,
      description: dto.description,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      cpf: dto.cpf,
      expirationDays: dto.expirationDays,
    });

    return payment;
  }

  async createSubscription(dto: CreateSubscriptionDto) {
    const payment = await this.prisma.payment.create({
      data: {
        type: PaymentType.SUBSCRIPTION,
        amount: 0,
        description: dto.reason,
        customerEmail: dto.email,
      },
    });

    await this.producer.enqueueSubscription(payment.id, {
      planId: dto.planId,
      email: dto.email,
      cardTokenId: dto.cardTokenId,
      reason: dto.reason,
    });

    return payment;
  }

  async findAll(params: { page?: number; limit?: number; status?: string; type?: string }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (params.status) where.status = params.status as any;
    if (params.type) where.type = params.type as any;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  async cancel(id: string) {
    const payment = await this.findOne(id);
    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED' },
    });
  }
}
