import { NestFactory } from '@nestjs/core';
import { WorkerNotificationsModule } from './worker-notifications.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerNotificationsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
