import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsPositive, IsInt } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Source wallet UUID (must belong to the authenticated user)' })
  @IsUUID('4', { message: 'fromWalletId must be a valid UUID' })
  fromWalletId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', description: 'Destination wallet UUID' })
  @IsUUID('4', { message: 'toWalletId must be a valid UUID' })
  toWalletId: string;

  @ApiProperty({
    example: 1000,
    description: 'Amount in cents (smallest currency unit). e.g. 1000 = $10.00',
    minimum: 1,
  })
  @IsInt({ message: 'Amount must be an integer (in cents)' })
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount: number;
}
