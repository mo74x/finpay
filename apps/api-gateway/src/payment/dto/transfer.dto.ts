import { IsUUID, IsPositive, IsInt } from 'class-validator';

export class TransferDto {
  @IsUUID('4', { message: 'fromWalletId must be a valid UUID' })
  fromWalletId: string;

  @IsUUID('4', { message: 'toWalletId must be a valid UUID' })
  toWalletId: string;

  /**
   * Amount in cents (smallest currency unit).
   * e.g. 1000 = $10.00
   */
  @IsInt({ message: 'Amount must be an integer (in cents)' })
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;
}
