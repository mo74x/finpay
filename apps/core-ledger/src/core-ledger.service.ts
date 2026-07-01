import { Injectable } from '@nestjs/common';

@Injectable()
export class CoreLedgerService {
  getHello(): string {
    return 'Hello World!';
  }
}
