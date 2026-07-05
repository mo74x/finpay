/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
 
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { IdempotencyStore } from './idempotency.store';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly store: IdempotencyStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only apply idempotency to state-changing requests
    if (request.method !== 'POST') {
      return next.handle();
    }

    const idempotencyKey: string | undefined = request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException('x-idempotency-key header is required for this operation');
    }

    // Convert the async Redis lookup into an Observable, then switchMap
    return from(this.store.get(idempotencyKey)).pipe(
      switchMap((cached) => {
        if (cached !== null) {
          this.logger.log(`[IDEMPOTENCY HIT] key: ${idempotencyKey}`);
          response.status(200);
          return of(cached);
        }

        // Cache miss — execute the handler and persist the result
        return next.handle().pipe(
          tap((data: unknown) => {
            this.logger.log(`[IDEMPOTENCY MISS] caching key: ${idempotencyKey}`);
            // Fire-and-forget — don't block the response
            void this.store.set(idempotencyKey, data);
          }),
        );
      }),
    );
  }
}