import { Module } from '@nestjs/common';
import { CoreLedgerController } from './core-ledger.controller';
import { CoreLedgerService } from './core-ledger.service';
import { PrismaModule } from './prisma/prisma.module';
import { LedgerModule } from './ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  controllers: [CoreLedgerController],
  providers: [CoreLedgerService],
})
export class CoreLedgerModule {}
