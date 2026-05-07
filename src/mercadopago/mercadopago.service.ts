import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  Payment,
  PaymentRefund,
  PreApproval,
} from 'mercadopago';
import type { PaymentCreateData } from 'mercadopago/dist/clients/payment/create/types';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import type { PreApprovalCreateData } from 'mercadopago/dist/clients/preApproval/create/types';

export interface PixPaymentInput {
  amount: number;
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  expirationMinutes?: number;
}

export interface CreditCardPaymentInput {
  amount: number;
  description: string;
  email: string;
  token: string;
  installments: number;
  issuerId?: string;
  paymentMethodId: string;
}

export interface BoletoPaymentInput {
  amount: number;
  description: string;
  email: string;
  firstName: string;
  lastName: string;
  cpf: string;
  expirationDays?: number;
}

export interface SubscriptionInput {
  planId: string;
  email: string;
  cardTokenId: string;
  reason: string;
}

@Injectable()
export class MercadoPagoService implements OnModuleInit {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private paymentClient: Payment;
  private paymentRefundClient: PaymentRefund;
  private preApprovalClient: PreApproval;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new MercadoPagoConfig({
      accessToken: this.config.getOrThrow<string>('MP_ACCESS_TOKEN'),
      options: { timeout: 5000 },
    });
    this.paymentClient = new Payment(this.client);
    this.paymentRefundClient = new PaymentRefund(this.client);
    this.preApprovalClient = new PreApproval(this.client);
    this.logger.log('MercadoPago client initialized');
  }

  async createPixPayment(input: PixPaymentInput): Promise<PaymentResponse> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (input.expirationMinutes ?? 30));

    const body: PaymentCreateData['body'] = {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: 'pix',
      payer: {
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
      },
      date_of_expiration: expiresAt.toISOString(),
    };

    return this.paymentClient.create({ body });
  }

  async createCreditCardPayment(input: CreditCardPaymentInput): Promise<PaymentResponse> {
    const body: PaymentCreateData['body'] = {
      transaction_amount: input.amount,
      description: input.description,
      token: input.token,
      installments: input.installments,
      payment_method_id: input.paymentMethodId,
      issuer_id: input.issuerId ? Number(input.issuerId) : undefined,
      payer: { email: input.email },
    };

    return this.paymentClient.create({ body });
  }

  async createBoleto(input: BoletoPaymentInput): Promise<PaymentResponse> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expirationDays ?? 3));

    const body: PaymentCreateData['body'] = {
      transaction_amount: input.amount,
      description: input.description,
      payment_method_id: 'bolbradesco',
      payer: {
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        identification: { type: 'CPF', number: input.cpf },
      },
      date_of_expiration: expiresAt.toISOString(),
    };

    return this.paymentClient.create({ body });
  }

  async createSubscription(input: SubscriptionInput): Promise<any> {
    const body: PreApprovalCreateData['body'] = {
      preapproval_plan_id: input.planId,
      reason: input.reason,
      payer_email: input.email,
      card_token_id: input.cardTokenId,
      status: 'authorized',
    };

    return this.preApprovalClient.create({ body });
  }

  async getPayment(id: string): Promise<PaymentResponse> {
    return this.paymentClient.get({ id });
  }

  async refundPayment(id: string, amount?: number): Promise<any> {
    return this.paymentRefundClient.create({
      payment_id: Number(id),
      body: amount ? { amount } : {},
    });
  }

  async cancelPayment(id: string): Promise<PaymentResponse> {
    return this.paymentClient.cancel({ id });
  }
}
