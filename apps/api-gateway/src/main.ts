import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './api-gateway.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TraceInterceptor } from './trace/trace.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Stamp every request with a unique correlation ID for distributed tracing
  app.useGlobalInterceptors(new TraceInterceptor());

  // Validate and transform all incoming request bodies against their DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw if unknown properties are sent
      transform: true,       // Auto-transform payload types (e.g. string → number)
    }),
  );

  // Return standardised error responses instead of raw NestJS exceptions
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

