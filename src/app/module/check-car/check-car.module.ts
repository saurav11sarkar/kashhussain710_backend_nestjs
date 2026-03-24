import { Module } from '@nestjs/common';
import { CheckCarService } from './check-car.service';
import { CheckCarController } from './check-car.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckCar, CheckCarSchema } from './entities/check-car.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CheckCar.name, schema: CheckCarSchema },
    ]),
  ],
  controllers: [CheckCarController],
  providers: [CheckCarService],
})
export class CheckCarModule {}
