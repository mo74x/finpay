import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CoreLedgerController } from './core-ledger.controller';
import { CoreLedgerService } from './core-ledger.service';
import { PrismaModule } from './prisma/prisma.module';
import { LedgerModule } from './ledger/ledger.module';
import { LedgerController } from './ledger/ledger.controller';

@Module({
  imports: [
    // Connect core-ledger to Redis for the invoice-queue producer
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    PrismaModule,
    LedgerModule,
  ],
  controllers: [CoreLedgerController, LedgerController],
  providers: [CoreLedgerService],
})
export class CoreLedgerModule {}

