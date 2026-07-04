/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
 
 
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { CoreLedgerModule } from './core-ledger.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreLedgerModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 8877, // Port where our database worker listens
      },
    },
  );
  await app.listen();
  console.log('Core Ledger Microservice is listening...');
}
void bootstrap();