/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LedgerService } from './ledger.service';

@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @MessagePattern({ cmd: 'execute_transfer' })
  async handleTransfer(
    @Payload() data: { fromWalletId: string; toWalletId: string; amount: number; ref: string; correlationId?: string }
  ) {
    return this.ledgerService.transferFunds(
      data.fromWalletId,
      data.toWalletId,
      data.amount,
      data.ref,
    );
  }

  @MessagePattern({ cmd: 'verify_wallet_ownership' })
  async handleVerifyOwnership(
    @Payload() data: { userId: string; walletId: string }
  ) {
    return this.ledgerService.verifyWalletOwnership(data.userId, data.walletId);
  }
}