/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Generate a unique ID for this specific API journey
    const correlationId = uuidv4();
    request.headers['x-correlation-id'] = correlationId;

    // In a real system using nestjs-pino, you would inject this into the async context
    console.log(`[GATEWAY] [TraceID: ${correlationId}] Incoming request to ${request.url}`);

    return next.handle();
  }
}
