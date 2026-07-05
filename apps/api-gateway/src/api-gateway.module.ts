import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from 'nestjs-pino';
import { PaymentController } from './payment/payment.controller';
import { AuthModule } from './auth/auth.module';
import { SearchModule } from './search/search.module';
import { IdempotencyStore } from './idempotency/idempotency.store';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';

@Module({
  imports: [
    // Structured JSON logging (pino). Pretty-print in dev, raw JSON in production.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        // Automatically include correlation ID from request headers in every log
        customProps: (req) => ({
          correlationId: String(req.headers['x-correlation-id'] ?? ''),
        }),
      },
    }),
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