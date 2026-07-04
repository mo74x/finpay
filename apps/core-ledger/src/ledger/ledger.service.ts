/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async transferFunds(
    fromWalletId: string,
    toWalletId: string,
    amountInCents: number,
    transactionRef: string,
  ) {
    if (amountInCents <= 0) {
      throw new BadRequestException(
        'Transfer amount must be greater than zero',
      );
    }

    if (fromWalletId === toWalletId) {
      throw new BadRequestException('Cannot transfer funds to the same wallet');
    }

    // Wrap everything in an ACID database transaction
    return this.prisma
      .$transaction(async (tx) => {
        const senderWallets = await tx.$queryRaw<any[]>`
        SELECT id, balance FROM "Wallet" 
        WHERE id = ${fromWalletId} 
        FOR UPDATE
      `;

        const senderWallet = senderWallets[0];
        if (!senderWallet) {
          throw new BadRequestException('Sender wallet not found');
        }

        // 2. VALIDATE THE BALANCE STATE AFTER LOCK IS ACQUIRED
        if (senderWallet.balance < amountInCents) {
          throw new BadRequestException(
            'Insufficient funds for this transaction',
          );
        }

        // Lock the receiver's wallet row as well to avoid conflicts on their end
        const receiverWallets = await tx.$queryRaw<any[]>`
        SELECT id FROM "Wallet" 
        WHERE id = ${toWalletId} 
        FOR UPDATE
      `;
        const receiverWallet = receiverWallets[0];
        if (!receiverWallet) {
          throw new BadRequestException('Receiver wallet not found');
        }

        //EXECUTE DOUBLE-ENTRY LEDGER WRITES
        // Debit Entry
        const debitEntry = await tx.ledgerEntry.create({
          data: {
            walletId: fromWalletId,
            amount: -amountInCents, // Negative value for Debit
            transactionRef,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.COMPLETED,
          },
        });

        // Credit Entry
        const creditEntry = await tx.ledgerEntry.create({
          data: {
            walletId: toWalletId,
            amount: amountInCents, // Positive value for Credit
            transactionRef,
            type: TransactionType.TRANSFER,
            status: TransactionStatus.COMPLETED,
          },
        });

        // UPDATE AGGREGATE WALLET BALANCES
        // Deduct from sender
        const updatedSender = await tx.wallet.update({
          where: { id: fromWalletId },
          data: { balance: { decrement: amountInCents } },
        });

        // Add to receiver
        await tx.wallet.update({
          where: { id: toWalletId },
          data: { balance: { increment: amountInCents } },
        });

        if (debitEntry.amount + creditEntry.amount !== 0) {
          throw new InternalServerErrorException(
            'Ledger imbalance detected. Rolling back.',
          );
        }

        return {
          status: 'SUCCESS',
          transactionRef,
          newSenderBalance: updatedSender.balance,
        };
      })
      .catch((error) => {
        throw error;
      });
  }
}
