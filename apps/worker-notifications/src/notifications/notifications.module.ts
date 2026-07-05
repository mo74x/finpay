import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  providers: [NotificationsService, NotificationsProcessor]
})
export class NotificationsModule {}
