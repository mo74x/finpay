import { Test, TestingModule } from '@nestjs/testing';
import { WorkerNotificationsController } from './worker-notifications.controller';
import { WorkerNotificationsService } from './worker-notifications.service';

describe('WorkerNotificationsController', () => {
  let workerNotificationsController: WorkerNotificationsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [WorkerNotificationsController],
      providers: [WorkerNotificationsService],
    }).compile();

    workerNotificationsController = app.get<WorkerNotificationsController>(WorkerNotificationsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(workerNotificationsController.getHello()).toBe('Hello World!');
    });
  });
});
