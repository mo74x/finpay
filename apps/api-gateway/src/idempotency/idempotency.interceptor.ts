/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IdempotencyStore } from './idempotency.store';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  // Injected singleton — shared across ALL requests
  constructor(private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only apply idempotency to state-changing requests
    if (request.method !== 'POST') {
      return next.handle();
    }

    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException('x-idempotency-key header is required for this operation');
    }

    if (this.store.has(idempotencyKey)) {
      this.logger.log(`[IDEMPOTENCY HIT] Returning cached response for key: ${idempotencyKey}`);
      const cachedResponse = this.store.get(idempotencyKey);
      response.status(200);
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap((data) => {
        this.logger.log(`[IDEMPOTENCY MISS] Caching new response for key: ${idempotencyKey}`);
        this.store.set(idempotencyKey, data);
      }),
    );
  }
}