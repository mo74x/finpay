import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment/payment.controller';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { IdempotencyStore } from './idempotency/idempotency.store';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';

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
    SearchModule,
  ],
  controllers: [PaymentController],
  // Singletons — shared across all requests
  providers: [IdempotencyStore, IdempotencyInterceptor],
})
export class AppModule {}