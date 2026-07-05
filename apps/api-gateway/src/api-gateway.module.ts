import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment/payment.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Register the TCP Client that points to our Ledger
    ClientsModule.register([
      {
        name: 'CORE_LEDGER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 8877, // Must match the port from Phase 2
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [PaymentController],
})
export class AppModule {}