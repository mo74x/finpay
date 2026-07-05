import { Module } from '@nestjs/common';
import { WorkerNotificationsController } from './worker-notifications.controller';
import { WorkerNotificationsService } from './worker-notifications.service';
import { NotificationsModule } from './notifications/notifications.module';
import { BullModule } from '@nestjs/bull';

@Module({
 imports: [
    // Connect to Redis
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    NotificationsModule,
  ],
  controllers: [WorkerNotificationsController],
  providers: [WorkerNotificationsService],
})
export class WorkerNotificationsModule {}
