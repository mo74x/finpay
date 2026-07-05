/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Inject, Post, UseInterceptors } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';

@Controller('v1/payments')
export class PaymentController {
  constructor(
    // Inject the TCP client we registered in the AppModule
    @Inject('CORE_LEDGER_SERVICE') private readonly ledgerClient: ClientProxy,
  ) {}

  @Post('transfer')
  @UseInterceptors(IdempotencyInterceptor) // Protect this route!
  async executeTransfer(
    @Body() transferDto: { fromWalletId: string; toWalletId: string; amount: number }
  ) {
    // Generate a unique transaction reference for the database
    const transactionRef = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Send the command over TCP to the core-ledger microservice
    // firstValueFrom converts the NestJS RxJS Observable into a standard Promise
    const result = await firstValueFrom(
      this.ledgerClient.send(
        { cmd: 'execute_transfer' }, // The MessagePattern we defined in Phase 2
        {
          fromWalletId: transferDto.fromWalletId,
          toWalletId: transferDto.toWalletId,
          amount: transferDto.amount,
          ref: transactionRef,
        }
      )
    );

    return result;
  }
}