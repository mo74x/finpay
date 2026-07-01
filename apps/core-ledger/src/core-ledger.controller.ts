import { Controller, Get } from '@nestjs/common';
import { CoreLedgerService } from './core-ledger.service';

@Controller()
export class CoreLedgerController {
  constructor(private readonly coreLedgerService: CoreLedgerService) {}

  @Get()
  getHello(): string {
    return this.coreLedgerService.getHello();
  }
}
