import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkerNotificationsService {
  getHello(): string {
    return 'Hello World!';
  }
}
