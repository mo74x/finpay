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
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private idempotencyCache = new Map<string, any>();

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

    if (this.idempotencyCache.has(idempotencyKey)) {
      console.log(`[IDEMPOTENCY HIT] Returning cached response for key: ${idempotencyKey}`);
      const cachedResponse = this.idempotencyCache.get(idempotencyKey);
      response.status(200); 
      return of(cachedResponse);
    }

    return next.handle().pipe(
      tap((data) => {
        console.log(`[IDEMPOTENCY MISS] Caching new response for key: ${idempotencyKey}`);
        this.idempotencyCache.set(idempotencyKey, data);
      }),
    );
  }
}