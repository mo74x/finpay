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
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransferDto } from './dto/transfer.dto';
import { SearchService } from '../search/search.service';

@Controller('v1/payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    @Inject('CORE_LEDGER_SERVICE') private readonly ledgerClient: ClientProxy,
    private readonly searchService: SearchService,
  ) {}

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  async executeTransfer(
    @Req() req,
    @Body() transferDto: TransferDto,
  ) {
    const correlationId = req.headers['x-correlation-id'] as string;

    // Step 1: Verify the sender owns the source wallet
    const isOwner = await firstValueFrom(
      this.ledgerClient.send(
        { cmd: 'verify_wallet_ownership' },
        { userId: req.user.userId, walletId: transferDto.fromWalletId },
      ),
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not have permission to debit this wallet');
    }

    const transactionRef = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Step 2: Execute the ACID transfer in the ledger microservice
    const result = await firstValueFrom(
      this.ledgerClient.send(
        { cmd: 'execute_transfer' },
        {
          fromWalletId: transferDto.fromWalletId,
          toWalletId: transferDto.toWalletId,
          amount: transferDto.amount,
          ref: transactionRef,
          correlationId, // Pass the trace!
        },
      ),
    );

    // Step 3: Index the completed transaction into Elasticsearch (fire-and-forget)
    // Runs async — does NOT block the response to the client
    void this.searchService
      .indexTransaction({
        transactionRef,
        fromWalletId: transferDto.fromWalletId,
        toWalletId: transferDto.toWalletId,
        amount: transferDto.amount,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
        correlationId,
      })
      .catch((err: Error) =>
        this.logger.error(`Failed to index transaction ${transactionRef}: ${err.message}`),
      );

    return result;
  }
}