import { Test, TestingModule } from '@nestjs/testing';
import { MotHistoryController } from './mot-history.controller';
import { MotHistoryService } from './mot-history.service';

describe('MotHistoryController', () => {
  let controller: MotHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MotHistoryController],
      providers: [MotHistoryService],
    }).compile();

    controller = module.get<MotHistoryController>(MotHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
