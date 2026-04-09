import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarTaxService } from './car-tax.service';
import { CarTaxController } from './car-tax.controller';
import { CarTax, CarTaxSchema } from './entities/car-tax.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  Subscribe,
  SubscribeSchema,
} from '../subscribe/entities/subscribe.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarTax.name, schema: CarTaxSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscribe.name, schema: SubscribeSchema },
    ]),
  ],
  controllers: [CarTaxController],
  providers: [CarTaxService],
})
export class CarTaxModule {}
