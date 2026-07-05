import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './api-gateway.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TraceInterceptor } from './trace/trace.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use pino as the application logger — all Logger() calls now emit structured JSON
  app.useLogger(app.get(Logger));

  // Stamp every request with a unique correlation ID for distributed tracing
  app.useGlobalInterceptors(new TraceInterceptor());

  // Validate and transform all incoming request bodies against their DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw if unknown properties are sent
      transform: true,            // Auto-transform payload types (e.g. string → number)
    }),
  );

  // Return standardised error responses instead of raw NestJS exceptions
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI — only expose in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FinPay API')
      .setDescription(
        'Production-ready fintech payment API. ' +
        'Handles double-entry ledger transfers, async invoice generation, and full-text transaction search.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('auth', 'Register and obtain JWT tokens')
      .addTag('payments', 'Execute and query financial transfers')
      .addTag('search', 'Full-text search across transaction history')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();



