import { Controller, Get } from '@nestjs/common';
import { WorkerNotificationsService } from './worker-notifications.service';

@Controller()
export class WorkerNotificationsController {
  constructor(private readonly workerNotificationsService: WorkerNotificationsService) {}

  @Get()
  getHello(): string {
    return this.workerNotificationsService.getHello();
  }
}
