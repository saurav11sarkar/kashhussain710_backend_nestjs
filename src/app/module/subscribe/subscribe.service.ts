import { HttpException, Injectable } from '@nestjs/common';
import { CreateSubscribeDto } from './dto/create-subscribe.dto';
import { UpdateSubscribeDto } from './dto/update-subscribe.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Subscribe, SubscribeDocument } from './entities/subscribe.entity';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class SubscribeService {
  constructor(
    @InjectModel(Subscribe.name)
    private readonly subscribeModel: Model<SubscribeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createSubscribe(createSubscribeDto: CreateSubscribeDto) {
    const { planName } = createSubscribeDto;
    const exist = await this.subscribeModel.findOne({ planName });
    if (exist) {
      throw new HttpException('alrady create this plan', 404);
    }
    const result = await this.subscribeModel.create(createSubscribeDto);
    return result;
  }
}
