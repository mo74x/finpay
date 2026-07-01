import { NestFactory } from '@nestjs/core';
import { CoreLedgerModule } from './core-ledger.module';

async function bootstrap() {
  const app = await NestFactory.create(CoreLedgerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
