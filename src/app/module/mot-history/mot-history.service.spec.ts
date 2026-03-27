import { Test, TestingModule } from '@nestjs/testing';
import { MotHistoryService } from './mot-history.service';

describe('MotHistoryService', () => {
  let service: MotHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MotHistoryService],
    }).compile();

    service = module.get<MotHistoryService>(MotHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
