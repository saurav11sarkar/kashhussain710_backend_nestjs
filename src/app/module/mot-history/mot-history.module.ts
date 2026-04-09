import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MotHistoryService } from './mot-history.service';
import { MotHistoryController } from './mot-history.controller';
import { MotHistory, MotHistorySchema } from './entities/mot-history.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MotHistory.name, schema: MotHistorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MotHistoryController],
  providers: [MotHistoryService],
  exports: [MotHistoryService],
})
export class MotHistoryModule {}
