import {
  IsEmail, IsNotEmpty, IsNumber, IsOptional,
  IsPositive, IsString, Matches, Min,
} from 'class-validator';

export class CreateBoletoPaymentDto {
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
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF must contain 11 digits' })
  cpf: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  expirationDays?: number;
}
