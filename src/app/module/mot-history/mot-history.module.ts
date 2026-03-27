import { Module } from '@nestjs/common';
import { MotHistoryService } from './mot-history.service';
import { MotHistoryController } from './mot-history.controller';

@Module({
  controllers: [MotHistoryController],
  providers: [MotHistoryService],
})
export class MotHistoryModule {}
