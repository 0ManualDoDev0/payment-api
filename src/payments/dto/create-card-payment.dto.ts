import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateCardPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsInt()
  @Min(1)
  installments: number;

  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  issuerId?: string;
}
