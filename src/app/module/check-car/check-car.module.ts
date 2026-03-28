import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckCarService } from './check-car.service';
import { CheckCarController } from './check-car.controller';
import { CheckCar, CheckCarSchema } from './entities/check-car.entity';

import { User, UserSchema } from '../user/entities/user.entity';
import {
  MotHistory,
  MotHistorySchema,
} from '../mot-history/entities/mot-history.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CheckCar.name, schema: CheckCarSchema },
      { name: MotHistory.name, schema: MotHistorySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CheckCarController],
  providers: [CheckCarService],
})
export class CheckCarModule {}
