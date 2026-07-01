import { Module } from '@nestjs/common';
import { CoreLedgerController } from './core-ledger.controller';
import { CoreLedgerService } from './core-ledger.service';

@Module({
  imports: [],
  controllers: [CoreLedgerController],
  providers: [CoreLedgerService],
})
export class CoreLedgerModule {}
