import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [PrismaModule,
    BullModule.registerQueue({
      name: 'invoice-queue',
    }),],
  providers: [LedgerService],
})
export class LedgerModule { }
