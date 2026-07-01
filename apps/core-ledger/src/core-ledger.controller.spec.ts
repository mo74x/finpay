import { Test, TestingModule } from '@nestjs/testing';
import { CoreLedgerController } from './core-ledger.controller';
import { CoreLedgerService } from './core-ledger.service';

describe('CoreLedgerController', () => {
  let coreLedgerController: CoreLedgerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoreLedgerController],
      providers: [CoreLedgerService],
    }).compile();

    coreLedgerController = app.get<CoreLedgerController>(CoreLedgerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(coreLedgerController.getHello()).toBe('Hello World!');
    });
  });
});
