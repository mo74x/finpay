/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Inject,
  Post,
  UseInterceptors,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransferDto } from './dto/transfer.dto';


@Controller('v1/payments')
export class PaymentController {
  constructor(
    @Inject('CORE_LEDGER_SERVICE') private readonly ledgerClient: ClientProxy,
  ) {}

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async executeTransfer(
    @Req() req,
    @Body() transferDto: TransferDto
  ) {
    
    const isOwner = await firstValueFrom(
      this.ledgerClient.send(
        { cmd: 'verify_wallet_ownership' },
        { userId: req.user.userId, walletId: transferDto.fromWalletId }
      )
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to debit this wallet');
    }

    const transactionRef = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await firstValueFrom(
      this.ledgerClient.send(
        { cmd: 'execute_transfer' },
        {
          fromWalletId: transferDto.fromWalletId,
          toWalletId: transferDto.toWalletId,
          amount: transferDto.amount,
          ref: transactionRef,
          correlationId: req.headers['x-correlation-id'], // Pass the trace!
        }
      )
    );

    return result;
  }
}