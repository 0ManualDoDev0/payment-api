import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  cardTokenId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
